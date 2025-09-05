import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { MedioCobro } from './entities/medio-cobro.entity';
import { RequestContext } from '../../common/request-context';

@Injectable()
export class MediosCobroService {
  constructor(@InjectRepository(MedioCobro) private repo: Repository<MedioCobro>) {}

  async create(dto: { nombre: string; tipo?: string; activo?: boolean }) {
    const tenantId = RequestContext.tenantId()!;
    const exists = await this.repo.findOne({ where: { tenant_id: tenantId, nombre: dto.nombre } });
    if (exists) throw new ConflictException('Ya existe un medio con ese nombre');
    // Convert 'tipo' string to the expected TipoMedio type if necessary
    const entity = this.repo.create({
      ...dto,
      tenant_id: tenantId,
      tipo: dto.tipo ? (dto.tipo as any) : undefined // Cast or map as needed
    });
    return this.repo.save(entity);
  }

  async list(q?: { q?: string; activo?: 'true' | 'false' }) {
    const tenantId = RequestContext.tenantId()!;
    const qb = this.repo.createQueryBuilder('m').where('m.tenant_id = :tenantId', { tenantId });
    if (q?.q) qb.andWhere('(m.nombre ILIKE :q OR m.tipo ILIKE :q)', { q: `%${q.q}%` });
    if (q?.activo === 'true') qb.andWhere('m.activo = true');
    if (q?.activo === 'false') qb.andWhere('m.activo = false');
    return qb.orderBy('m.nombre', 'ASC').getMany();
  }

  async findOne(id: number) {
    const tenantId = RequestContext.tenantId()!;
    const e = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    if (!e) throw new NotFoundException('Medio no encontrado');
    return e;
  }

  async update(id: number, dto: Partial<MedioCobro>) {
    const e = await this.findOne(id);
    Object.assign(e, dto);
    return this.repo.save(e);
  }

  async remove(id: number) {
    const tenantId = RequestContext.tenantId()!;
    const res = await this.repo.softDelete({ id, tenant_id: tenantId });
    if (!res.affected) throw new NotFoundException('Medio no encontrado');
    return { ok: true };
  }
}
