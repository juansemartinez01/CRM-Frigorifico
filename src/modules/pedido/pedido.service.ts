import {
  Injectable,
  NotFoundException,
  Scope,
  Inject,
  BadRequestException,
  ConflictException,
  
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, DataSource, QueryFailedError } from 'typeorm';
import { REQUEST } from '@nestjs/core';  
import { Request } from 'express';
import { getTenantIdFromReq } from '@app/common/multi-tenant/tenant.util';
import { Pedido } from './pedido.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { BuscarPedidoDto } from './dto/buscar-pedido.dto';
import { paginate, Paginated } from '@app/common/pagination/pagination.util';
import { MovimientoCuentaCorriente } from '../mov-cta-cte/movimiento-cta-cte.entity';
import { ConfirmarPedidoDto } from './dto/confirmar-pedido.dto';
import { ModificarConfirmacionDto } from './dto/modificar-confirmacion.dto';
import { Cliente } from '@app/modules/cliente/cliente.entity';

@Injectable({ scope: Scope.REQUEST })
export class PedidoService {
  constructor(
    @InjectRepository(Pedido) private repo: Repository<Pedido>,
    @Inject(REQUEST) private readonly req: Request,

    private ds: DataSource,
  ) {}

  private whereTenant(extra?: FindOptionsWhere<Pedido>) {
    const tenantId = getTenantIdFromReq(this.req);
    return { tenantId, ...(extra ?? {}) };
  }

  async create(dto: CreatePedidoDto) {
    const entity = this.repo.create({
      ...dto,
      tenantId: getTenantIdFromReq(this.req),
    });
    return this.repo.save(entity);
  }

  async findAll() {
    return this.repo.find({ where: this.whereTenant() });
  }

  async findOne(id: string) {
    const row = await this.repo.findOne({ where: this.whereTenant({ id }) });
    if (!row) throw new NotFoundException('Pedido no encontrado');
    return row;
  }

  async update(id: string, dto: UpdatePedidoDto) {
    const row = await this.findOne(id);
    Object.assign(row, dto);
    return this.repo.save(row);
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    await this.repo.remove(row);
    return { ok: true };
  }

  async search(f: BuscarPedidoDto): Promise<Paginated<Pedido>> {
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.cliente', 'c')
      .where('p.tenantId = :tenantId', { tenantId: this.tenantId() });

    if (f.clienteId)
      qb.andWhere('p.clienteId = :clienteId', { clienteId: f.clienteId });
    if (f.numeroRemito)
      qb.andWhere('p.numeroRemito ILIKE :nr', { nr: `%${f.numeroRemito}%` });
    if (f.articulo)
      qb.andWhere('p.articulo ILIKE :art', { art: `%${f.articulo}%` });
    if (f.fechaDesde) qb.andWhere('p.fechaRemito >= :fd', { fd: f.fechaDesde });
    if (f.fechaHasta) qb.andWhere('p.fechaRemito <= :fh', { fh: f.fechaHasta });

    const sortMap = {
      fechaRemito: 'p.fechaRemito',
      numeroRemito: 'p.numeroRemito',
      createdAt: 'p.createdAt',
    } as const;
    qb.orderBy(sortMap[f.sortBy || 'fechaRemito'], f.sortDir || 'DESC');

    return paginate(qb, f.page, f.limit);
  }

  private tenantId() {
    return getTenantIdFromReq(this.req);
  }

  /*
   * Confirma un pedido asignando cliente definitivo y precio por kilo,
   * calcula el total e impacta un movimiento de VENTA ligado al pedido.
   * Idempotente: (tenant, tipo=VENTA, pedidoId) único.
   */
  async confirmarPedido(dto: ConfirmarPedidoDto) {
    const tenantId = this.tenantId();
    const precioUnit = Number(dto.precioUnitario);
    if (!isFinite(precioUnit) || precioUnit <= 0) {
      throw new BadRequestException('precioUnitario inválido');
    }

    return this.ds.transaction(async (m) => {
      const pedido = await m.getRepository(Pedido).findOne({
        where: { tenantId, id: dto.pedidoId },
      });
      if (!pedido) throw new NotFoundException('Pedido no encontrado');

      // ⛔ Pre-chequeo: ¿ya confirmado?
      const existente = await m
        .getRepository(MovimientoCuentaCorriente)
        .findOne({
          where: { tenantId, tipo: 'VENTA', pedidoId: pedido.id },
        });
      if (existente) {
        throw new ConflictException({
          code: 'ALREADY_CONFIRMED',
          message: 'Este pedido ya fue confirmado previamente.',
          movimientoId: existente.id,
          monto: existente.monto,
          fecha: existente.fecha,
        });
      }

      // 👉 cargar y asignar el cliente definitivo (para refrescar la relación eager)
      const cRepo = m.getRepository(Cliente);
      const cliente = await cRepo.findOne({
        where: { tenantId, id: dto.clienteId },
      });
      if (!cliente)
        throw new NotFoundException('Cliente destino no encontrado');

      // actualizar cliente final y precios
      const kg = Number(pedido.kg ?? 0);
      const total = +(kg * precioUnit).toFixed(2);

      pedido.clienteId = dto.clienteId;
      pedido.precioUnitario = precioUnit.toFixed(2);
      pedido.precioTotal = total.toFixed(2);

      if (dto.nota) {
        pedido.nota = dto.nota;
      }

      if (dto.observaciones) {
        pedido.observaciones = [pedido.observaciones, dto.observaciones]
          .filter(Boolean)
          .join(' | ');
      }

      pedido.confirmado = true;

      await m.getRepository(Pedido).save(pedido);

      // Crear movimiento ligado al pedido (VENTA)
      const mov = m.getRepository(MovimientoCuentaCorriente).create({
        tenantId,
        clienteId: dto.clienteId,
        tipo: 'VENTA',
        fecha: pedido.fechaRemito ?? new Date(),
        monto: total.toFixed(2),
        pedidoId: pedido.id,
      });

      try {
        await m.getRepository(MovimientoCuentaCorriente).save(mov);
      } catch (err) {
        // 🧯 Colisión concurrente: índice único (tenant, tipo, pedidoId)
        if (
          err instanceof QueryFailedError &&
          // @ts-ignore — pg driver
          err.driverError?.code === '23505'
        ) {
          throw new ConflictException({
            code: 'ALREADY_CONFIRMED',
            message: 'Este pedido ya fue confirmado previamente.',
          });
        }
        throw err;
      }

      return {
        ok: true,
        pedido,
        movimiento: mov,
      };
    });
  }

  /**
   * Modifica una confirmación existente:
   * - Actualiza cliente y/o precio por kilo
   * - Recalcula precioTotal
   * - Actualiza el movimiento VENTA asociado (o lo recrea, si se pide)
   */
  async modificarConfirmacion(dto: ModificarConfirmacionDto) {
    const tenantId = this.tenantId();

    if (!dto.clienteId && !dto.precioUnitario && !dto.observaciones) {
      throw new BadRequestException(
        'Debes enviar al menos clienteId, precioUnitario u observaciones',
      );
    }

    const recrear = (dto.recrearMovimiento ?? 'false').toLowerCase() === 'true';

    return this.ds.transaction(async (m) => {
      const pRepo = m.getRepository(Pedido);
      const movRepo = m.getRepository(MovimientoCuentaCorriente);

      const pedido = await pRepo.findOne({
        where: { tenantId, id: dto.pedidoId },
      });
      if (!pedido) throw new NotFoundException('Pedido no encontrado');

      // debe existir confirmación previa (movimiento VENTA asociado)
      let mov = await movRepo.findOne({
        where: { tenantId, tipo: 'VENTA', pedidoId: pedido.id },
      });
      if (!mov) {
        throw new ConflictException({
          code: 'NO_CONFIRMADO',
          message:
            'Este pedido aún no fue confirmado. Usa /pedidos/confirmar primero.',
        });
      }

      // aplicar cambios en pedido
      if (dto.clienteId) pedido.clienteId = dto.clienteId;

      let total: number | undefined;
      if (dto.precioUnitario) {
        const precioUnit = Number(dto.precioUnitario);
        if (!isFinite(precioUnit) || precioUnit <= 0) {
          throw new BadRequestException('precioUnitario inválido');
        }
        const kg = Number(pedido.kg ?? 0);
        total = +(kg * precioUnit).toFixed(2);
        pedido.precioUnitario = precioUnit.toFixed(2);
        pedido.precioTotal = total.toFixed(2);
      }

      if (dto.observaciones) {
        pedido.observaciones = [pedido.observaciones, dto.observaciones]
          .filter(Boolean)
          .join(' | ');
      }

      await pRepo.save(pedido);

      // actualizar o recrear movimiento
      if (recrear) {
        await movRepo.remove(mov);
        mov = movRepo.create({
          tenantId,
          clienteId: pedido.clienteId, // ya actualizado
          tipo: 'VENTA',
          fecha: pedido.fechaRemito ?? new Date(),
          monto: (total ?? Number(mov.monto)).toFixed(2),
          pedidoId: pedido.id,
        });
        await movRepo.save(mov);
      } else {
        if (dto.clienteId) mov.clienteId = dto.clienteId;
        if (dto.precioUnitario && typeof total === 'number')
          mov.monto = total.toFixed(2);
        mov.fecha = pedido.fechaRemito ?? mov.fecha;
        await movRepo.save(mov);
      }

      return {
        ok: true,
        pedido,
        movimiento: mov,
      };
    });
  }
}
