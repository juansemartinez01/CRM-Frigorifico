import { Injectable, Scope, Inject, BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Request } from 'express';
import * as XLSX from 'xlsx';

import { ImportPedidosDto } from './dto/import-pedidos.dto';
import { RazonSocial } from '@app/modules/razon-social/razon-social.entity';
import { Revendedor } from '@app/modules/revendedor/revendedor.entity';
import { Cliente } from '@app/modules/cliente/cliente.entity';
import { Pedido } from '@app/modules/pedido/pedido.entity';
import { getTenantIdFromReq } from '@app/common/multi-tenant/tenant.util';

type Row = {
  FECHA_REMITO?: any;
  REMITO?: any;
  CUIT_CLIENTE?: any;
  CLIENTE?: any;
  ARTICULO?: any;
  CANTIDAD?: any;
  KILOS?: any;
};

@Injectable({ scope: Scope.REQUEST })
export class PedidoImportService {
  constructor(
    private readonly ds: DataSource,
    @Inject(REQUEST) private readonly req: Request,
    @InjectRepository(RazonSocial) private rsRepo: Repository<RazonSocial>,
    @InjectRepository(Revendedor) private rvRepo: Repository<Revendedor>,
    @InjectRepository(Cliente) private clRepo: Repository<Cliente>,
    @InjectRepository(Pedido) private pdRepo: Repository<Pedido>,
  ) {}

  private tenantId() {
    return getTenantIdFromReq(this.req);
  }

  private yyyy_mm_dd(d: Date) {
    const y = d.getFullYear();
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  /** Soporta: Date, serial de Excel, ISO y dd/MM/yyyy (y variantes con - . y HH:mm[:ss]) */
  private parseFecha(value: any): Date | null {
    if (value == null) return null;

    // 1) Ya es Date
    if (value instanceof Date && !Number.isNaN(value.getTime())) return value;

    // 2) Serial Excel
    if (typeof value === 'number') {
      const dc: any = (XLSX as any).SSF?.parse_date_code?.(value);
      if (dc && dc.y && dc.m && dc.d) return new Date(dc.y, dc.m - 1, dc.d);
    }

    // 3) Texto
    const s = String(value).trim();
    if (!s) return null;

    // 3.a) ISO directo (YYYY-MM-DD)
    const iso = new Date(s);
    if (!Number.isNaN(iso.getTime())) return iso;

    // 3.b) dd/MM/yyyy (también dd-MM-yyyy o dd.MM.yyyy, con hora opcional)
    const m = s.match(
      /^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
    );
    if (m) {
      const d = parseInt(m[1], 10);
      const mo = parseInt(m[2], 10);
      let y = parseInt(m[3], 10);
      if (y < 100) y += 2000; // años 2 dígitos → 20xx
      const hh = m[4] ? parseInt(m[4], 10) : 0;
      const mm = m[5] ? parseInt(m[5], 10) : 0;
      const ss = m[6] ? parseInt(m[6], 10) : 0;

      const date = new Date(y, mo - 1, d, hh, mm, ss);
      // validar consistencia (evita 31/02/2025 → corrimiento)
      if (
        date.getFullYear() === y &&
        date.getMonth() === mo - 1 &&
        date.getDate() === d
      ) {
        return date;
      }
    }

    return null;
  }

  private normalizeCuit(cuit: any): string | null {
    if (cuit == null) return null;
    const s = String(cuit).trim();
    return s.length ? s : null;
  }

  private toDecStr(x: any, decimals: number): string {
    const n = Number(String(x).replace(',', '.'));
    if (Number.isFinite(n)) return n.toFixed(decimals);
    return (0).toFixed(decimals);
  }

  private async ensureSystemRazonSocial(cuit: string) {
    let rs = await this.rsRepo.findOne({
      where: { tenantId: this.tenantId(), cuit },
    });
    if (!rs) {
      rs = this.rsRepo.create({ tenantId: this.tenantId(), cuit });
      rs = await this.rsRepo.save(rs);
    }
    return rs;
  }

  private async ensureSystemCliente(cuit: string, rsCuit: string) {
    const rs = await this.ensureSystemRazonSocial(rsCuit);
    let c = await this.clRepo.findOne({
      where: { tenantId: this.tenantId(), cuit },
    });
    if (!c) {
      c = this.clRepo.create({
        tenantId: this.tenantId(),
        cuit,
        razonSocialId: rs.id,
        revendedorId: null,
      });
      c = await this.clRepo.save(c);
    }
    return c;
  }

  private async ensureTemporalCliente() {
    return this.ensureSystemCliente('00-00000000-1', '00-00000000-1');
  }
  private async ensureNoRegistradoCliente() {
    return this.ensureSystemCliente('99-99999999-9', '99-99999999-9');
  }

  private async resolveClienteIdByCuit(
    cuit: string,
  ): Promise<{ clienteId: string; note?: string }> {
    const tenantId = this.tenantId();

    // 1) Razon Social
    const rs = await this.rsRepo.findOne({ where: { tenantId, cuit } });
    if (rs) {
      const clientes = await this.clRepo.find({
        where: { tenantId, razonSocialId: rs.id },
      });
      if (clientes.length === 1) return { clienteId: clientes[0].id };
      if (clientes.length > 1) {
        const temp = await this.ensureTemporalCliente();
        return {
          clienteId: temp.id,
          note: `RS con múltiples clientes para CUIT ${cuit}. Candidatos: ${clientes.map((c) => c.id).join(', ')}`,
        };
      }
      // si RS existe pero sin clientes asociados → seguimos con Revendedor
    }

    // 2) Revendedor
    const rv = await this.rvRepo.findOne({ where: { tenantId, cuit } });
    if (rv) {
      const clientes = await this.clRepo.find({
        where: { tenantId, revendedorId: rv.id },
      });
      if (clientes.length === 1) return { clienteId: clientes[0].id };
      if (clientes.length > 1) {
        const temp = await this.ensureTemporalCliente();
        return {
          clienteId: temp.id,
          note: `Revendedor con múltiples clientes para CUIT ${cuit}. Candidatos: ${clientes.map((c) => c.id).join(', ')}`,
        };
      }
    }

    // 3) Cliente por CUIT
    const cliente = await this.clRepo.findOne({ where: { tenantId, cuit } });
    if (cliente) return { clienteId: cliente.id };

    // 4) No encontrado
    const noReg = await this.ensureNoRegistradoCliente();
    return {
      clienteId: noReg.id,
      note: `CUIT ${cuit} no encontrado. Asociado a 'No registrado'.`,
    };
  }

  async importarExcel(
    file: Express.Multer.File,
    { fechaDesde, sheetName }: ImportPedidosDto,
  ) {
    if (!file?.buffer?.length) {
      throw new BadRequestException('Falta el archivo (form-data key: file)');
    }
    const fechaD = new Date(fechaDesde); // Query exige ISO (YYYY-MM-DD)
    if (Number.isNaN(fechaD.getTime())) {
      throw new BadRequestException(
        'fechaDesde inválida. Formato esperado: YYYY-MM-DD',
      );
    }

    // Parseo Excel (dejamos raw:true para que las fechas sigan siendo Date si la celda es fecha)
    const wb = XLSX.read(file.buffer, { type: 'buffer', cellDates: true });
    const sheet =
      (sheetName && wb.Sheets[sheetName]) ||
      wb.Sheets['Detalle Remitos'] ||
      wb.Sheets[wb.SheetNames[0]];

    if (!sheet)
      throw new BadRequestException('No se encontró hoja válida en el Excel');

    const rows = XLSX.utils.sheet_to_json<Row>(sheet, {
      raw: true,
      defval: null,
    });

    const wantedCols = [
      'FECHA_REMITO',
      'REMITO',
      'CUIT_CLIENTE',
      'CLIENTE',
      'ARTICULO',
      'CANTIDAD',
      'KILOS',
    ];

    // Métricas
    const processedRows: number[] = [];
    const created: string[] = [];
    const duplicates: string[] = [];
    const unresolved: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // --- AGRUPACIÓN POR (REMITO, ARTICULO) ---
    type Group = {
      remito: string;
      articulo: string;
      // usamos la fecha mínima del grupo (en práctica debería ser la misma)
      fechaRemito: string;
      // sumatorias
      cantidadSum: number;
      kgSum: number;
      // tomamos el primer cliente resuelto; si difiere en el grupo, lo anotamos en observaciones
      clienteId: string;
      notes: Set<string>;
      clientesExcel: Set<string>; // valores de columna CLIENTE del excel
    };
    const groups = new Map<string, Group>();

    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];

      // Validar columnas mínimas
      const missing = wantedCols.filter((c) => !(c in r));
      if (missing.length) {
        warnings.push(
          `Fila ${idx + 2}: faltan columnas ${missing.join(', ')}. Se ignora fila.`,
        );
        continue;
      }

      // Fecha filtro
      const fr = this.parseFecha(r.FECHA_REMITO);
      if (!fr) {
        warnings.push(
          `Fila ${idx + 2}: FECHA_REMITO inválida "${r.FECHA_REMITO}". Se ignora fila.`,
        );
        continue;
      }
      if (fr < fechaD) continue; // filtrar por fecha DESDE

      const numeroRemito = String(r.REMITO ?? '').trim();
      const articulo = String(r.ARTICULO ?? '').trim();
      if (!numeroRemito || !articulo) {
        warnings.push(
          `Fila ${idx + 2}: REMITO o ARTICULO vacío. Se ignora fila.`,
        );
        continue;
      }

      const cuit = this.normalizeCuit(r.CUIT_CLIENTE);
      const cantidadStr = this.toDecStr(r.CANTIDAD, 2);
      const kilosStr = this.toDecStr(r.KILOS, 3);
      const clienteNombre = String(r.CLIENTE ?? '').trim();

      try {
        let note: string | undefined;
        let clienteId: string;

        if (cuit) {
          const res = await this.resolveClienteIdByCuit(cuit);
          clienteId = res.clienteId;
          note = res.note;
          if (res.note?.includes('múltiples')) {
            unresolved.push(
              `Fila ${idx + 2}: ${res.note} | Remito=${numeroRemito} | Art=${articulo}`,
            );
          }
        } else {
          const noReg = await this.ensureNoRegistradoCliente();
          clienteId = noReg.id;
          note = `CUIT vacío. Asociado a 'No registrado'.`;
        }

        const key = `${numeroRemito}||${articulo}`;
        const fechaStr = this.yyyy_mm_dd(fr);
        const cantidadNum = Number(cantidadStr);
        const kgNum = Number(kilosStr);

        let g = groups.get(key);
        if (!g) {
          g = {
            remito: numeroRemito,
            articulo,
            fechaRemito: fechaStr,
            cantidadSum: isFinite(cantidadNum) ? cantidadNum : 0,
            kgSum: isFinite(kgNum) ? kgNum : 0,
            clienteId,
            notes: new Set<string>(),
            clientesExcel: new Set<string>(),
          };
          groups.set(key, g);
        } else {
          // sumar cantidades/pesos
          if (isFinite(cantidadNum)) g.cantidadSum += cantidadNum;
          if (isFinite(kgNum)) g.kgSum += kgNum;

          // fecha mínima del grupo
          if (fechaStr < g.fechaRemito) g.fechaRemito = fechaStr;

          // si cambia el cliente dentro del mismo grupo, lo anotamos
          if (g.clienteId !== clienteId) {
            g.notes.add(
              `Grupo con clientes distintos (primer clienteId=${g.clienteId}, otro=${clienteId})`,
            );
          }
        }

        if (note) g.notes.add(note);
        if (clienteNombre) g.clientesExcel.add(clienteNombre);

        processedRows.push(idx + 2);
      } catch (e: any) {
        errors.push(`Fila ${idx + 2}: ${e?.message ?? 'Error desconocido'}`);
      }
    }

    // --- INSERT POR GRUPO (idempotente con orIgnore) ---
    for (const g of groups.values()) {
      const observaciones =
        [
          ...g.notes,
          g.clientesExcel.size
            ? `ClienteExcel="${Array.from(g.clientesExcel).join(', ')}"`
            : null,
        ]
          .filter(Boolean)
          .join(' | ') || null;

      try {
        const id = await this.ds.transaction(async (m) => {
          const pRepo = m.getRepository(Pedido);

          const values = {
            tenantId: this.tenantId(),
            clienteId: g.clienteId,
            fechaRemito: g.fechaRemito,
            numeroRemito: g.remito,
            articulo: g.articulo,
            cantidad: g.cantidadSum.toFixed(2), // ⬅️ sumatoria de CANTIDAD
            kg: g.kgSum.toFixed(3), // ⬅️ sumatoria de KILOS (lo que pediste)
            observaciones,
          };

          const result = await pRepo
            .createQueryBuilder()
            .insert()
            .into(Pedido)
            .values(values)
            .orIgnore() // ON CONFLICT DO NOTHING (requiere índice único de firma)
            .returning('id') // PG: retorna id si insertó
            .execute();

          return (result.identifiers?.[0]?.id as string) ?? null;
        });

        if (id) {
          created.push(id);
        } else {
          duplicates.push(
            `${g.fechaRemito} | ${g.remito} | ${g.articulo} | ${g.cantidadSum.toFixed(
              2,
            )} | ${g.kgSum.toFixed(3)}`,
          );
        }
      } catch (e: any) {
        errors.push(
          `Grupo REMITO="${g.remito}" ART="${g.articulo}": ${e?.message ?? 'Error desconocido'}`,
        );
      }
    }

    return {
      ok: true,
      resumen: {
        filasLeidas: rows.length,
        filasConocidas: processedRows.length,
        gruposProcesados: groups.size,
        creadas: created.length,
        duplicadosSaltados: duplicates.length,
        pendientesResolucion: unresolved.length,
        warnings: warnings.length,
        errors: errors.length,
      },
      duplicados: duplicates.slice(0, 100),
      pendientes: unresolved.slice(0, 100),
      warnings: warnings.slice(0, 100),
      errors: errors.slice(0, 100),
    };
  }
}
