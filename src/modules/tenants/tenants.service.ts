import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(@InjectRepository(Tenant) private repo: Repository<Tenant>) {}

  async create(dto: CreateTenantDto) {
    const t = this.repo.create({ ...dto, tenant_id: 0 }); // se sobrescribe por subscriber si hay contexto
    return this.repo.save(t);
  }

  async findAll() {
    return this.repo.find();
  }
}
