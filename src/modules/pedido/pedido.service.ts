import {
  Injectable,
  NotFoundException,
  Scope,
  Inject,
  
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { REQUEST } from '@nestjs/core';  
import { Request } from 'express';
import { getTenantIdFromReq } from '@app/common/multi-tenant/tenant.util';
import { Pedido } from './pedido.entity';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { BuscarPedidoDto } from './dto/buscar-pedido.dto';
import { paginate, Paginated } from '@app/common/pagination/pagination.util';

@Injectable({ scope: Scope.REQUEST })
export class PedidoService {
  constructor(
    @InjectRepository(Pedido) private repo: Repository<Pedido>,
    @Inject(REQUEST) private readonly req: Request,
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
}
