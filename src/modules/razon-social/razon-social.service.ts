import {
  Injectable,
  NotFoundException,
  Scope,
  Inject,
  
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';  
import { Repository, FindOptionsWhere } from 'typeorm';
import { RazonSocial } from './razon-social.entity';
import { CreateRazonSocialDto } from './dto/create-razon-social.dto';
import { UpdateRazonSocialDto } from './dto/update-razon-social.dto';
import { Request } from 'express';
import { getTenantIdFromReq } from '@app/common/multi-tenant/tenant.util';

@Injectable({ scope: Scope.REQUEST })
export class RazonSocialService {
  constructor(
    @InjectRepository(RazonSocial) private repo: Repository<RazonSocial>,
    @Inject(REQUEST) private readonly req: Request,
  ) {}

  private whereTenant(extra?: FindOptionsWhere<RazonSocial>) {
    const tenantId = getTenantIdFromReq(this.req);
    return { tenantId, ...(extra ?? {}) };
  }

  async create(dto: CreateRazonSocialDto) {
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
    if (!row) throw new NotFoundException('RazonSocial no encontrada');
    return row;
  }

  async update(id: string, dto: UpdateRazonSocialDto) {
    const row = await this.findOne(id);
    Object.assign(row, dto);
    return this.repo.save(row);
  }

  async remove(id: string) {
    const row = await this.findOne(id);
    await this.repo.remove(row);
    return { ok: true };
  }
}
