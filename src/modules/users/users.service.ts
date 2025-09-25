import {
  Injectable,
  Inject,
  Scope,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import * as argon2 from 'argon2';
import { Request } from 'express';
import { User } from './user.entity';

@Injectable({ scope: Scope.REQUEST })
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    @Inject(REQUEST) private readonly req: Request,
  ) {}

  private tenantId() {
    const tid = this.req.tenantId;
    if (!tid) throw new BadRequestException('Tenant no determinado');
    return tid;
  }

  async findAll() {
    return this.repo.find({ where: { tenantId: this.tenantId() } });
  }

  async findOne(id: string) {
    const row = await this.repo.findOne({
      where: { tenantId: this.tenantId(), id },
    });
    if (!row) throw new NotFoundException('Usuario no encontrado');
    return row;
  }

  async findByEmail(email: string, tenantId: string) {
    return this.repo.findOne({ where: { tenantId, email } });
  }

  async create(dto: {
    email: string;
    password: string;
    name?: string;
    roles?: string[];
  }) {
    const tenantId = this.tenantId();
    const exists = await this.findByEmail(dto.email, tenantId);
    if (exists) throw new BadRequestException('Email ya existe en este tenant');

    const passwordHash = await argon2.hash(dto.password);
    const roles = dto.roles?.length ? dto.roles : ['read'];

    const entity = this.repo.create({
      tenantId,
      email: dto.email.toLowerCase().trim(),
      passwordHash,
      name: dto.name?.trim() || null,
      roles,
      isActive: true,
    });
    return this.repo.save(entity);
  }

  async update(
    id: string,
    dto: {
      email?: string;
      password?: string;
      name?: string;
      roles?: string[];
      isActive?: boolean;
    },
  ) {
    const user = await this.findOne(id);

    if (dto.email && dto.email !== user.email) {
      const already = await this.findByEmail(dto.email, this.tenantId());
      if (already && already.id !== user.id) {
        throw new BadRequestException('Email ya utilizado en este tenant');
      }
      user.email = dto.email.toLowerCase().trim();
    }

    if (dto.password) {
      user.passwordHash = await argon2.hash(dto.password);
    }

    if (typeof dto.name !== 'undefined') user.name = dto.name?.trim() || null;
    if (Array.isArray(dto.roles) && dto.roles.length) user.roles = dto.roles;
    if (typeof dto.isActive === 'boolean') user.isActive = dto.isActive;

    return this.repo.save(user);
  }

  async remove(id: string) {
    const user = await this.findOne(id);
    await this.repo.remove(user);
    return { ok: true };
  }

  async validatePassword(user: User, plain: string) {
    return argon2.verify(user.passwordHash, plain);
  }
}
