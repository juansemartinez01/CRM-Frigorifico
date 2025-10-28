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
import { Revendedor } from './revendedor.entity';
import { CreateRevendedorDto } from './dto/create-revendedor.dto';
import { UpdateRevendedorDto } from './dto/update-revendedor.dto';
import { Request } from 'express';
import { getTenantIdFromReq } from '@app/common/multi-tenant/tenant.util';

@Injectable({ scope: Scope.REQUEST })
export class RevendedorService {
  constructor(
    @InjectRepository(Revendedor) private repo: Repository<Revendedor>,
    @Inject(REQUEST) private readonly req: Request,
  ) {}

  private whereTenant(extra?: FindOptionsWhere<Revendedor>) {
    const tenantId = getTenantIdFromReq(this.req);
    return { tenantId, ...(extra ?? {}) };
  }

  async create(dto: CreateRevendedorDto) {
    const tenantId = getTenantIdFromReq(this.req);

    if (dto.cuit) {
      const dup = await this.repo.findOne({
        where: { tenantId, cuit: dto.cuit },
      });
      if (dup) {
        const display = dup.nombre || dup.cuit;
        throw new BadRequestException(
          `El CUIT ${dto.cuit} ya existe y pertenece al revendedor "${display}".`,
        );
      }
    }

    const entity = this.repo.create({ ...dto, tenantId });
    return this.repo.save(entity);
  }

  async findAll() {
    return this.repo.find({ where: this.whereTenant() });
  }

  async findOne(id: string) {
    const row = await this.repo.findOne({ where: this.whereTenant({ id }) });
    if (!row) throw new NotFoundException('Revendedor no encontrado');
    return row;
  }

  async update(id: string, dto: UpdateRevendedorDto) {
    const row = await this.findOne(id);
    if (dto.cuit && dto.cuit !== row.cuit) {
      const dup = await this.repo.findOne({
        where: { tenantId: getTenantIdFromReq(this.req), cuit: dto.cuit },
      });
      if (dup) {
        const display = dup.nombre || dup.cuit;
        throw new BadRequestException(
          `El CUIT ${dto.cuit} ya existe y pertenece al revendedor "${display}".`,
        );
      }
    }
    Object.assign(row, dto);
    return this.repo.save(row);
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    await this.repo.remove(row);
    return { ok: true };
  }
}
