import { Injectable, Scope, Inject, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';  
import { DataSource, Repository } from 'typeorm';
import { MovimientoCuentaCorriente, TipoMovimiento } from './movimiento-cta-cte.entity';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { Request } from 'express';
import { getTenantIdFromReq } from '@app/common/multi-tenant/tenant.util';
import { CuentaCorrienteService } from '@app/modules/cuenta-corriente/cuenta-corriente.service';
import { BuscarMovimientoDto } from './dto/buscar-movimiento.dto';
import { paginate, Paginated } from '@app/common/pagination/pagination.util';
import { CuentaCorriente } from '../cuenta-corriente/cuenta-corriente.entity';
import { UpdateMovimientoDto } from './dto/update-movimiento.dto';

@Injectable({ scope: Scope.REQUEST })
export class MovimientoCtaCteService {
  constructor(
    @InjectRepository(MovimientoCuentaCorriente)
    private repo: Repository<MovimientoCuentaCorriente>,
    private readonly ds: DataSource,
    private readonly ctaService: CuentaCorrienteService,
    @Inject(REQUEST) private readonly req: Request,
  ) {}

  private tenantId() {
    return getTenantIdFromReq(this.req);
  }

  async create(dto: CreateMovimientoDto) {
    return this.ds.transaction(async (m) => {
      // 1) crear movimiento
      const movRepo = m.getRepository(MovimientoCuentaCorriente);
      const mov = movRepo.create({ ...dto, tenantId: this.tenantId() });

      // normalización de nota
      if (typeof dto.nota === 'string') {
        mov.nota = dto.nota.trim() || null;
      }

      const saved = await movRepo.save(mov);
      // 2) aplicar al saldo
      await this.ctaService.applyMovimiento(dto.clienteId, dto.tipo, dto.monto);
      return saved;
    });
  }

  async listByCliente(clienteId: string) {
    return this.repo.find({
      where: { tenantId: this.tenantId(), clienteId },
      order: { fecha: 'DESC', createdAt: 'DESC' },
    });
  }
  async search(
    f: BuscarMovimientoDto,
  ): Promise<Paginated<MovimientoCuentaCorriente>> {
    const qb = this.repo
      .createQueryBuilder('m')
      .leftJoinAndSelect('m.cliente', 'c')
      .leftJoinAndSelect('m.pedido', 'p') // 👈 incluye todos los campos del pedido
      .leftJoinAndSelect('p.cliente', 'pc') // 👈 (opcional) cliente del pedido
      .where('m.tenantId = :tenantId', { tenantId: this.tenantId() });

    if (f.clienteId)
      qb.andWhere('m.clienteId = :clienteId', { clienteId: f.clienteId });
    if (f.tipo) qb.andWhere('m.tipo = :tipo', { tipo: f.tipo });
    if (f.fechaDesde) qb.andWhere('m.fecha >= :fd', { fd: f.fechaDesde });
    if (f.fechaHasta) qb.andWhere('m.fecha <= :fh', { fh: f.fechaHasta });

    if (f.montoMin) qb.andWhere('m.monto >= :min', { min: f.montoMin });
    if (f.montoMax) qb.andWhere('m.monto <= :max', { max: f.montoMax });

    if (f.pagado) {
      qb.andWhere('m.pagado = :pagado', { pagado: f.pagado });
    }


    const sortMap = { fecha: 'm.fecha', createdAt: 'm.createdAt' } as const;
    qb.orderBy(sortMap[f.sortBy || 'fecha'], f.sortDir || 'DESC');

    return paginate(qb, f.page, f.limit);
  }

  async setPagado(id: string, pagado: boolean) {
    const mov = await this.repo.findOne({
      where: { id, tenantId: this.tenantId() },
    });
    if (!mov) throw new NotFoundException('Movimiento no encontrado');

    mov.pagado = pagado;
    return this.repo.save(mov);
  }

  /**
   * Edita un movimiento existente y ajusta los saldos de cuenta corriente.
   * - Revierte el impacto del movimiento original en el saldo del cliente original.
   * - Aplica el impacto del nuevo movimiento (que puede cambiar cliente/tipo/monto/fecha/pedidoId).
   * - Maneja cambio de cliente y colisiones del índice único (tenant, tipo, pedidoId) cuando pedidoId no es null.
   */
  async update(id: string, dto: UpdateMovimientoDto) {
    const tenantId = this.tenantId();

    // Validaciones básicas de entrada (opcional pero útil)
    if (dto.tipo && dto.tipo !== 'VENTA' && dto.tipo !== 'COBRO') {
      throw new BadRequestException('tipo inválido');
    }
    if (dto.monto && Number.isNaN(Number(dto.monto))) {
      throw new BadRequestException('monto inválido');
    }

    return this.ds.transaction(async (m) => {
      const movRepo = m.getRepository(MovimientoCuentaCorriente);
      const ccRepo = m.getRepository(CuentaCorriente);

      // 1) Traer movimiento original
      const original = await movRepo.findOne({
        where: { tenantId, id },
      });
      if (!original) throw new NotFoundException('Movimiento no encontrado');

      const parseMonto = (v: string | number | undefined | null): number => {
        if (v === undefined || v === null) return NaN;
        const n = Number(v);
        return Number.isFinite(n) ? n : NaN;
      };
      const sign = (t: TipoMovimiento) => (t === 'VENTA' ? +1 : -1);

      // 2) Revertir impacto del movimiento original en el cliente original
      const oldSign = sign(original.tipo);
      const oldMonto = parseMonto(original.monto);
      if (Number.isNaN(oldMonto)) {
        throw new BadRequestException('Movimiento original con monto inválido');
      }

      // asegurar cuenta corriente del cliente original
      let ccOld = await ccRepo.findOne({
        where: { tenantId, clienteId: original.clienteId },
      });
      if (!ccOld) {
        ccOld = ccRepo.create({
          tenantId,
          clienteId: original.clienteId,
          saldo: '0.00',
        });
      }
      const ccOldNum = Number(ccOld.saldo ?? 0);
      const ccOldNuevoSaldo = +(ccOldNum - oldSign * oldMonto).toFixed(2); // revertir
      ccOld.saldo = ccOldNuevoSaldo.toFixed(2);
      await ccRepo.save(ccOld);

      // 3) Construir nuevos valores
      const newClienteId = dto.clienteId ?? original.clienteId;
      const newTipo = dto.tipo ?? original.tipo;
      const newFecha = dto.fecha ?? original.fecha;
      const newMontoNum = !dto.monto ? oldMonto : Number(dto.monto);
      if (!Number.isFinite(newMontoNum) || newMontoNum < 0) {
        throw new BadRequestException('monto inválido');
      }

      // pedidoId: permitir null explícito para desvincular
      const willChangePedidoId = Object.prototype.hasOwnProperty.call(
        dto,
        'pedidoId',
      );
      const newPedidoId = willChangePedidoId
        ? (dto.pedidoId ?? null)
        : original.pedidoId;

      // 4) Persistir cambios del movimiento (cuidando colisiones del índice único)
      original.clienteId = newClienteId;
      original.tipo = newTipo;
      original.fecha = newFecha;
      original.monto = newMontoNum.toFixed(2);
      original.pedidoId = newPedidoId;

      if (Object.prototype.hasOwnProperty.call(dto, 'nota')) {
        // permitir limpiar con string vacío -> null
        const n = (dto.nota ?? '').toString().trim();
        original.nota = n ? n : null;
      }

      try {
        await movRepo.save(original);
      } catch (e: any) {
        // 23505: unique_violation (índice ux_mov_tenant_tipo_pedido con pedido_id NOT NULL)
        if (e?.code === '23505') {
          throw new ConflictException(
            'Ya existe un movimiento VENTA/COBRO con ese pedido en este tenant (índice único por (tenant, tipo, pedidoId)).',
          );
        }
        throw e;
      }

      // 5) Aplicar impacto del nuevo movimiento en la cuenta del cliente (que puede ser distinto)
      let ccNew = await ccRepo.findOne({
        where: { tenantId, clienteId: newClienteId },
      });
      if (!ccNew) {
        ccNew = ccRepo.create({
          tenantId,
          clienteId: newClienteId,
          saldo: '0.00',
        });
      }
      const newSign = sign(newTipo);
      const ccNewNum = Number(ccNew.saldo ?? 0);
      const ccNewNuevoSaldo = +(ccNewNum + newSign * newMontoNum).toFixed(2);
      ccNew.saldo = ccNewNuevoSaldo.toFixed(2);
      await ccRepo.save(ccNew);


      const updated = await movRepo.findOne({
        where: { tenantId, id: original.id },
        relations: ['cliente', 'pedido'], // importante
      });

      return {
        ok: true,
        movimiento: updated,
        // útil para UI/debug:
        saldos: {
          [ccOld.clienteId]: ccOld.saldo,
          [ccNew.clienteId]: ccNew.saldo,
        },
      };
    });
  }
}
