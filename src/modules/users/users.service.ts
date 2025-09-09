import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { RolesService } from '../roles/roles.service';
import { RequestContext } from '../../common/request-context';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    private readonly rolesService: RolesService
  ) {}

  async create(dto: CreateUserDto) {
    const tenantId = RequestContext.tenantId();
    if (!tenantId) throw new ConflictException('Tenant no detectado');

    const exists = await this.repo.findOne({ where: { email: dto.email, tenant_id: tenantId } });
    if (exists) throw new ConflictException('Email ya registrado en este tenant');

    const password_hash = await bcrypt.hash(dto.password, 10);
    const user = this.repo.create({
      nombre: dto.nombre,
      email: dto.email,
      password_hash,
      tenant_id: tenantId,
    });

    if (dto.roles?.length) {
      user.roles = await this.rolesService.findByNames(dto.roles);
    }

    return this.repo.save(user);
  }

  async findByEmail(email: string) {
    const tenantId = RequestContext.tenantId();
    return this.repo.findOne({
      where: { email, tenant_id: tenantId },
      relations: ['roles'],
    });
  }

  async findAll() {
    const tenantId = RequestContext.tenantId();
    return this.repo.find({ where: { tenant_id: tenantId }, relations: ['roles'] });
  }
}
