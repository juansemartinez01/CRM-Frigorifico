import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Unidad } from './unidad.entity';
import { CreateUnidadDto } from './dto/create-unidad.dto';
import { UpdateUnidadDto } from './dto/update-unidad.dto';
import { QueryUnidadDto } from './dto/query-unidad.dto';
import { RequestContext } from '../../common/request-context';

@Injectable()
export class UnidadesService {
  constructor(@InjectRepository(Unidad) private repo: Repository<Unidad>) {}

  async create(dto: CreateUnidadDto) {
    const tenantId = RequestContext.tenantId()!;
    const exists = await this.repo.findOne({ where: { tenant_id: tenantId, nombre: dto.nombre } });
    if (exists) throw new ConflictException('Ya existe una unidad con ese nombre');
    const entity = this.repo.create({ ...dto, tenant_id: tenantId });
    return this.repo.save(entity);
  }

  async findAll(q: QueryUnidadDto) {
    const tenantId = RequestContext.tenantId()!;
    const qb = this.repo.createQueryBuilder('u')
      .where('u.tenant_id = :tenantId', { tenantId });

    if (q.q) qb.andWhere('(u.nombre ILIKE :q OR u.simbolo ILIKE :q)', { q: `%${q.q}%` });

    qb.orderBy(`u.${q.orderBy ?? 'nombre'}`, (q.order ?? 'ASC') as 'ASC'|'DESC');
    const page = q.page ?? 1, limit = q.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const tenantId = RequestContext.tenantId()!;
    const entity = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    if (!entity) throw new NotFoundException('Unidad no encontrada');
    return entity;
  }

  async update(id: number, dto: UpdateUnidadDto) {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: number) {
    const tenantId = RequestContext.tenantId()!;
    const res = await this.repo.softDelete({ id, tenant_id: tenantId });
    if (!res.affected) throw new NotFoundException('Unidad no encontrada');
    return { ok: true };
  }
}
