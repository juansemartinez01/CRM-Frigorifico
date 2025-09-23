import {
  Injectable,
  NotFoundException,
  Scope,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';  
import { Repository, FindOptionsWhere } from 'typeorm';
import { Cliente } from './cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { Request } from 'express';
import { getTenantIdFromReq } from '@app/common/multi-tenant/tenant.util';
import { BuscarClienteDto } from './dto/buscar-cliente.dto';
import { paginate, Paginated } from '@app/common/pagination/pagination.util';

@Injectable({ scope: Scope.REQUEST })
export class ClienteService {
  constructor(
    @InjectRepository(Cliente) private repo: Repository<Cliente>,
    @Inject(REQUEST) private readonly req: Request,
  ) {}

  private tenantId() {
    return getTenantIdFromReq(this.req);
  }

  private whereTenant(extra?: FindOptionsWhere<Cliente>) {
    return { tenantId: this.tenantId(), ...(extra ?? {}) };
  }

  async create(dto: CreateClienteDto) {
    const tenantId = getTenantIdFromReq(this.req);
    const entity = this.repo.create({ ...dto, tenantId });
    return this.repo.save(entity);
  }

  async findAll() {
    return this.repo.find({ where: this.whereTenant() });
  }

  async findOne(id: string) {
    const row = await this.repo.findOne({ where: this.whereTenant({ id }) });
    if (!row) throw new NotFoundException('Cliente no encontrado');
    return row;
  }

  async update(id: string, dto: UpdateClienteDto) {
    const row = await this.findOne(id);
    Object.assign(row, dto);
    return this.repo.save(row);
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    // También podrías validar que no tenga pedidos/cuenta si querés evitar borrado
    await this.repo.remove(row);
    return { ok: true };
  }

  async findByCuit(cuit: string) {
    const row = await this.repo.findOne({ where: this.whereTenant({ cuit }) });
    if (!row) throw new NotFoundException('Cliente no encontrado');
    return row;
  }

  async findByCuitExacto(cuit: string) {
    const row = await this.repo.findOne({ where: this.whereTenant({ cuit }) });
    if (!row) throw new NotFoundException('Cliente no encontrado');
    return row;
  }

  async search(f: BuscarClienteDto): Promise<Paginated<Cliente>> {
    const qb = this.repo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.razonSocial', 'rs')
      .leftJoinAndSelect('c.revendedor', 'rv')
      .where('c.tenantId = :tenantId', { tenantId: this.tenantId() });

    if (f.cuit) qb.andWhere('c.cuit ILIKE :cuit', { cuit: `%${f.cuit}%` });
    if (f.razonSocialId)
      qb.andWhere('c.razonSocialId = :rsid', { rsid: f.razonSocialId });
    if (f.revendedorId)
      qb.andWhere('c.revendedorId = :rvid', { rvid: f.revendedorId });

    const sortBy = f.sortBy === 'cuit' ? 'c.cuit' : /* default */ 'c.createdAt';
    qb.orderBy(sortBy, f.sortDir || 'DESC');

    return paginate(qb, f.page, f.limit);
  }
}
