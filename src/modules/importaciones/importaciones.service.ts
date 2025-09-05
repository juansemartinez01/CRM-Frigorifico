import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as XLSX from 'xlsx';
import { RequestContext } from '../../common/request-context';

import { ImportMap } from './entities/import-map.entity';
import { Cliente } from '../clientes/cliente.entity';
import { Unidad } from '../unidades/unidad.entity';
import { Producto } from '../productos/producto.entity';
import { RemitosService } from '../remitos/remitos.service';

function normStr(v: any): string | undefined {
  if (v === null || v === undefined) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}
function onlyDigits(s?: string) { return s ? s.replace(/\D+/g, '') : undefined; }

// ---- Normalización de encabezados ------------------------------------------------
const HEADER_ALIASES: Record<string, string[]> = {
  FECHA_REMITO: ['FECHA_REMITO', 'FECHA REMITO', 'FECHA', 'F.REMITO', 'FECHA_R', 'FEC REMITO'],
  REMITO: ['REMITO', 'NRO_REMITO', 'NRO REMITO', 'REMITO NRO', 'REMITO Nº', 'REM/NRO', 'REM', 'NREMITO', 'NUM REMITO'],
  CLIENTE: ['CLIENTE', 'RAZON SOCIAL', 'RAZÓN SOCIAL', 'NOMBRE CLIENTE', 'NOMBRE'],
  CUIT_CLIENTE: ['CUIT_CLIENTE', 'CUIT CLIENTE', 'CUIT', 'C.U.I.T', 'C.U.I.T.'],
  PRODUCTO: ['PRODUCTO', 'DESCRIPCION', 'DESCRIPCIÓN', 'DETALLE', 'ARTICULO', 'ARTÍCULO', 'CORTE', 'ITEM', '0'],
  UNID_MEDIDA: ['UNID_MEDIDA', 'UNIDAD', 'UNIDAD MEDIDA', 'UM', 'U.M.', 'MEDIDA'],
  KILOS: ['KILOS', 'KG', 'KGR', 'PESO', 'PESO_KG', 'PESO KG'],
  CANTIDAD: ['CANTIDAD', 'CANT', 'CANT.', 'UNIDADES', 'U', 'CANT UN', 'CANTIDAD UN'],
  ESPECIE: ['ESPECIE'],
  CHAPA: ['CHAPA', 'NRO CHAPA', 'N° CHAPA'],
  TROPA: ['TROPA', 'NRO TROPA', 'N° TROPA'],
  IVA: ['IVA'],
  COND_IVA: ['COND_IVA', 'COND IVA', 'CONDICION IVA', 'CONDICIÓN IVA'],
  SUBCATEGORIA: ['SUBCATEGORIA', 'SUBCATEGORÍA', 'SUBCAT', 'SUB-CATEGORIA'],
  NRO_CLIENTE: ['NRO_CLIENTE', 'NRO CLIENTE', 'ID CLIENTE', 'COD CLIENTE', 'CÓD CLIENTE'],
};

function stripAccents(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
function canon(s: string) {
  return stripAccents(s).replace(/\s+|[.\-_/]/g, '').toUpperCase();
}
function buildHeaderResolver(firstRowKeys: string[]) {
  // Mapeo de "canon(header)" => header original
  const dict = new Map<string, string>();
  for (const k of firstRowKeys) dict.set(canon(k), k);

  // Para cada clave canónica de negocio (PRODUCTO, REMITO, etc.), elegimos el alias presente.
  const pick: Record<string, string | undefined> = {};
  for (const want of Object.keys(HEADER_ALIASES)) {
    const aliases = HEADER_ALIASES[want];
    pick[want] = aliases.map(a => dict.get(canon(a))).find(Boolean);
  }
  // Helper get: lee un valor por clave semántica
  const get = (row: any, key: keyof typeof HEADER_ALIASES) => {
    const col = pick[key as string];
    return col ? row[col] : undefined;
  };
  return { pick, get, dict };
}
// -----------------------------------------------------------------------------

@Injectable()
export class ImportacionesService {
  private readonly logger = new Logger(ImportacionesService.name);

  constructor(
    @InjectRepository(ImportMap) private mapRepo: Repository<ImportMap>,
    @InjectRepository(Cliente) private clientes: Repository<Cliente>,
    @InjectRepository(Unidad) private unidades: Repository<Unidad>,
    @InjectRepository(Producto) private productos: Repository<Producto>,
    private readonly remitosService: RemitosService,
  ) {}

  async importDetalleRemitos(buffer: Buffer) {
    const tenantId = RequestContext.tenantId()!;
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheet = wb.Sheets['Detalle Remitos'];
    if (!sheet) throw new BadRequestException('Hoja "Detalle Remitos" no encontrada');

    const rows = XLSX.utils.sheet_to_json<any>(sheet, { defval: null });
    if (!rows.length) throw new BadRequestException('La hoja "Detalle Remitos" está vacía');

    const firstKeys = Object.keys(rows[0] ?? {});
    const { pick, get } = buildHeaderResolver(firstKeys);

    // Validación flexible de columnas mínimas
    const missing: string[] = [];
    // requeridos duros:
    for (const k of ['FECHA_REMITO', 'REMITO', 'CLIENTE', 'UNID_MEDIDA'] as const) {
      if (!pick[k]) missing.push(k);
    }
    // PRODUCTO: obligatorio pero aceptamos sinónimos (ya resueltos arriba)
    if (!pick.PRODUCTO) missing.push('PRODUCTO');
    // KILOS/CANTIDAD: no exigimos ambos; al menos uno debe existir
    if (!pick.KILOS && !pick.CANTIDAD) missing.push('KILOS|CANTIDAD');

    if (missing.length) {
      throw new BadRequestException(
        `Faltan columnas requeridas: ${missing.join(', ')}. Encabezados detectados: ${firstKeys.join(' | ')}`
      );
    }

    // Caches
    const cache = {
      clienteByCuit: new Map<string, number>(),
      clienteByNombre: new Map<string, number>(),
      unidadBySimbolo: new Map<string, number>(),
      productoByKey: new Map<string, number>(),
    };

    // A) asegurar Unidad (primero por nombre, luego por símbolo) según tu entidad Unidad
    const ensureUnidad = async (nombreUM: string, simbolo: string) => {
    // tu entidad Unidad tiene @Index(['tenant_id','nombre'], { unique: true })
    let u = await this.unidades.findOne({ where: { tenant_id: tenantId, nombre: nombreUM } });
    if (!u && simbolo) {
        u = await this.unidades.findOne({ where: { tenant_id: tenantId, simbolo: simbolo.toLowerCase() } });
    }
    if (!u) {
        u = this.unidades.create({ tenant_id: tenantId, nombre: nombreUM, simbolo: simbolo?.toLowerCase() ?? null });
        u = await this.unidades.save(u);
    }
    return u.id;
    };

    const ensureCliente = async (nombre?: string, cuitRaw?: any) => {
      const cuit = onlyDigits(normStr(cuitRaw));
      if (cuit) {
        if (cache.clienteByCuit.has(cuit)) return cache.clienteByCuit.get(cuit)!;
        let c = await this.clientes.findOne({ where: { tenant_id: tenantId, cuit } });
        if (!c) {
          c = this.clientes.create({ tenant_id: tenantId, nombre: normStr(nombre) ?? `Cliente ${cuit}`, cuit, activo: true });
          c = await this.clientes.save(c);
        }
        cache.clienteByCuit.set(cuit, c.id);
        return c.id;
      } else {
        const key = (normStr(nombre) ?? 'Cliente sin nombre').toUpperCase();
        if (cache.clienteByNombre.has(key)) return cache.clienteByNombre.get(key)!;
        let c = await this.clientes.findOne({ where: { tenant_id: tenantId, nombre: key } });
        if (!c) {
          c = this.clientes.create({ tenant_id: tenantId, nombre: key, activo: true });
          c = await this.clientes.save(c);
        }
        cache.clienteByNombre.set(key, c.id);
        return c.id;
      }
    };

    // B) asegurar Producto por (nombre + unidadId); SKU queda null
    const ensureProducto = async (nombre: string, unidadId: number) => {
    let p = await this.productos.findOne({ where: { tenant_id: tenantId, nombre, unidadId } });
    if (!p) {
        p = this.productos.create({ tenant_id: tenantId, nombre, unidadId, sku: null, activo: true });
        p = await this.productos.save(p);
    }
    return p.id;
    };

    type Group = {
      externalRemito: string;
      fecha: string;
      clienteId: number;
      obsExtra: string;
      items: Array<{ productoId: number; descripcion: string; cantidad: string; precio: string }>;
    };
    const groups = new Map<string, Group>();

    let created = { clientes: 0, unidades: 0, productos: 0, remitos: 0, items: 0, skipped: 0 };

    const before = {
      clientes: await this.clientes.count({ where: { tenant_id: tenantId } }),
      unidades: await this.unidades.count({ where: { tenant_id: tenantId } }),
      productos: await this.productos.count({ where: { tenant_id: tenantId } }),
    };

    for (const r of rows) {
      const remitoExtRaw = get(r, 'REMITO');
      const remitoExt = normStr(remitoExtRaw ?? '');
      if (!remitoExt) continue;

      // idempotencia: si ya mapeamos ese remito externo, saltar
      const already = await this.mapRepo.findOne({ where: { tenant_id: tenantId, source: 'Detalle Remitos', external_id: remitoExt } });
      if (already) { created.skipped++; continue; }

      const fechaVal = get(r, 'FECHA_REMITO');
      const d = fechaVal instanceof Date ? fechaVal : new Date(fechaVal);
      const fechaISO = isFinite(d.getTime()) ? d.toISOString().slice(0, 10) : undefined;
      if (!fechaISO) throw new BadRequestException(`FECHA_REMITO inválida para remito ${remitoExt}`);

      const umRaw = (normStr(get(r, 'UNID_MEDIDA')) || '').toLowerCase();
      const isPeso = /k|kilo|kg|kgr|peso/.test(umRaw);
        const nombreUM = isPeso ? 'Kilogramo' : 'Unidad';
        const simboloUM = isPeso ? 'kg' : 'un';
        const unidadId = await ensureUnidad(nombreUM, simboloUM);


      const clienteNombre = normStr(get(r, 'CLIENTE'));
      const clienteCuit   = normStr(get(r, 'CUIT_CLIENTE'));
      const clienteId = await ensureCliente(clienteNombre, clienteCuit);

      const prodNombre = normStr(get(r, 'PRODUCTO')) ?? 'Producto';
      const productoId = await ensureProducto(prodNombre, unidadId);

      // cantidad: según UM
      const kilosVal = get(r, 'KILOS');
      const cantVal  = get(r, 'CANTIDAD');
      const num = isPeso ? Number(kilosVal ?? cantVal ?? 0) : Number(cantVal ?? kilosVal ?? 0);
      const cantidad = (isFinite(num) ? num : 0).toFixed(3);
      const precio = '0.00';

      const descParts = [prodNombre];
      const chapa = normStr(get(r, 'CHAPA')); if (chapa) descParts.push(`CHAPA ${chapa}`);
      const tropa = normStr(String(get(r, 'TROPA') ?? '')); if (tropa) descParts.push(`TROPA ${tropa}`);
      const especie = normStr(get(r, 'ESPECIE')); if (especie) descParts.push(`(${especie})`);
      const descripcion = descParts.join(' - ');

      const key = `${remitoExt}|${fechaISO}|${clienteId}`;
      if (!groups.has(key)) {
        const extra = [];
        const nroCli = normStr(get(r, 'NRO_CLIENTE')); if (nroCli) extra.push(`NRO_CLIENTE:${nroCli}`);
        const iva = normStr(get(r, 'IVA')); if (iva) extra.push(`IVA:${iva}`);
        const cond = normStr(get(r, 'COND_IVA')); if (cond) extra.push(`COND_IVA:${cond}`);
        const subcat = normStr(get(r, 'SUBCATEGORIA')); if (subcat) extra.push(`SUBCAT:${subcat}`);
        groups.set(key, {
          externalRemito: remitoExt,
          fecha: fechaISO,
          clienteId,
          obsExtra: `EXTERNAL:${remitoExt}${extra.length ? ' | ' + extra.join(' | ') : ''}`,
          items: [],
        });
      }
      groups.get(key)!.items.push({ productoId, descripcion, cantidad, precio });
    }

    created.clientes = Math.max(0, (await this.clientes.count({ where: { tenant_id: tenantId } })) - before.clientes);
    created.unidades = Math.max(0, (await this.unidades.count({ where: { tenant_id: tenantId } })) - before.unidades);
    created.productos = Math.max(0, (await this.productos.count({ where: { tenant_id: tenantId } })) - before.productos);

    const results: Array<{ external: string; remitoId?: number; error?: string; createdItems?: number }> = [];
    for (const g of groups.values()) {
      try {
        const saved = await this.remitosService.create({
          fecha: g.fecha,
          clienteId: g.clienteId,
          observaciones: g.obsExtra,
          items: g.items,
        } as any);
        created.remitos += 1;
        created.items   += g.items.length;

        await this.mapRepo.save(this.mapRepo.create({
          tenant_id: tenantId,
          source: 'Detalle Remitos',
          external_id: g.externalRemito,
          entity: 'REMITO',
          entityId: saved.id,
        }));

        results.push({ external: g.externalRemito, remitoId: saved.id, createdItems: g.items.length });
      } catch (e: any) {
        results.push({ external: g.externalRemito, error: e?.message || 'error' });
      }
    }

    return { ok: true, counts: created, remitos: results };
  }
}
