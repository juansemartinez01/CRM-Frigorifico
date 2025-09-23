import {
  Injectable,
  Scope,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Request } from 'express';

import { Pedido } from '@app/modules/pedido/pedido.entity';
import { Cliente } from '@app/modules/cliente/cliente.entity';
import { PedidoResolucion } from './pedido-resolucion.entity';
import { ResolvePedidoDto } from './dto/resolve-pedido.dto';
import { ListarPendientesDto } from './dto/listar-pendientes.dto';
import { getTenantIdFromReq } from '@app/common/multi-tenant/tenant.util';
import { paginate, Paginated } from '@app/common/pagination/pagination.util';

const TEMP_CUIT = '00-00000000-1';
const NOREG_CUIT = '99-99999999-9';

@Injectable({ scope: Scope.REQUEST })
export class PedidoResolucionService {
  constructor(
    private readonly ds: DataSource,
    @Inject(REQUEST) private readonly req: Request,
    @InjectRepository(Pedido) private pedidoRepo: Repository<Pedido>,
    @InjectRepository(Cliente) private clienteRepo: Repository<Cliente>,
    @InjectRepository(PedidoResolucion)
    private auditRepo: Repository<PedidoResolucion>,
  ) {}

  private tenantId() {
    return getTenantIdFromReq(this.req);
  }

  /** Lista pedidos con cliente temporal o no-registrado */
  async listarPendientes(f: ListarPendientesDto): Promise<Paginated<Pedido>> {
    const qb = this.pedidoRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.cliente', 'c')
      .where('p.tenantId = :tenantId', { tenantId: this.tenantId() })
      .andWhere('c.cuit IN (:...cuits)', { cuits: [TEMP_CUIT, NOREG_CUIT] });

    if (f.numeroRemito)
      qb.andWhere('p.numeroRemito ILIKE :nr', { nr: `%${f.numeroRemito}%` });
    if (f.articulo)
      qb.andWhere('p.articulo ILIKE :art', { art: `%${f.articulo}%` });

    qb.orderBy('p.createdAt', f.sortDir || 'DESC');
    return paginate(qb, f.page, f.limit);
  }

  /** Cambia el cliente de un pedido pendiente (temporal/no registrado) a uno definitivo y registra auditoría */
  async resolverCliente(dto: ResolvePedidoDto) {
    const tenantId = this.tenantId();

    // Pedido
    const pedido = await this.pedidoRepo.findOne({
      where: { tenantId, id: dto.pedidoId },
      relations: ['cliente'],
    });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    // Debe estar pendiente (cliente temporal/no registrado)
    const cuitActual = pedido.cliente?.cuit ?? '';
    const isPendiente = cuitActual === TEMP_CUIT || cuitActual === NOREG_CUIT;
    if (!isPendiente) {
      throw new BadRequestException(
        'El pedido no está pendiente de resolución',
      );
    }

    // Cliente nuevo
    const nuevo = await this.clienteRepo.findOne({
      where: { tenantId, id: dto.clienteIdNuevo },
    });
    if (!nuevo)
      throw new NotFoundException('Cliente nuevo no encontrado en este tenant');

    if (nuevo.id === pedido.clienteId) {
      throw new BadRequestException('El cliente nuevo es igual al actual');
    }

    // Transacción: actualizar pedido + guardar auditoría
    const updated = await this.ds.transaction(async (m) => {
      const pRepo = m.getRepository(Pedido);
      const aRepo = m.getRepository(PedidoResolucion);

      const anteriorId = pedido.clienteId;
      pedido.clienteId = nuevo.id;

      // Anotación opcional en observaciones, concatenando
      const anota =
        `Resolución de cliente: ${pedido.cliente?.cuit ?? 'N/A'} -> ${nuevo.cuit}` +
        (dto.motivo ? ` | Motivo="${dto.motivo}"` : '');
      pedido.observaciones = [pedido.observaciones, anota]
        .filter(Boolean)
        .join(' | ')
        .slice(0, 2000);

      const saved = await pRepo.save(pedido);

      const audit = aRepo.create({
        tenantId,
        pedidoId: saved.id,
        clienteAnteriorId: anteriorId,
        clienteNuevoId: nuevo.id,
        motivo: dto.motivo ?? null,
        actor: dto.actor ?? null,
      });
      await aRepo.save(audit);

      // refrescamos relaciones mínimas
      return pRepo.findOne({ where: { id: saved.id }, relations: ['cliente'] });
    });

    return { ok: true, pedido: updated };
  }
}
