import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Cliente } from './cliente.entity';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClienteDto } from './dto/query-cliente.dto';
import { RequestContext } from '../../common/request-context';

@Injectable()
export class ClientesService {
  constructor(@InjectRepository(Cliente) private repo: Repository<Cliente>) {}

  async create(dto: CreateClienteDto) {
    const tenantId = RequestContext.tenantId()!;
    const entity = this.repo.create({ ...dto, tenant_id: tenantId });
    return this.repo.save(entity);
  }

  async findAll(qry: QueryClienteDto) {
    const tenantId = RequestContext.tenantId()!;
    const page = qry.page ?? 1;
    const limit = qry.limit ?? 10;

    const where: any = { tenant_id: tenantId };
    if (qry.q) {
      // Búsqueda simple por varios campos (ILIKE = case-insensitive)
      const like = ILike(`%${qry.q}%`);
      where['__or'] = true; // marcador interno para saber que combinamos manualmente
      // construiremos a mano en query builder para OR
    }
    // Query builder para poder hacer OR agrupado
    const qb = this.repo.createQueryBuilder('c')
      .where('c.tenant_id = :tenantId', { tenantId });

    if (qry.q) {
      qb.andWhere(
        '(c.nombre ILIKE :q OR c.email ILIKE :q OR c.cuit ILIKE :q OR c.telefono ILIKE :q)',
        { q: `%${qry.q}%` },
      );
    }

    if (qry.activo === 'true') qb.andWhere('c.activo = true');
    if (qry.activo === 'false') qb.andWhere('c.activo = false');

    const orderBy = ['id', 'nombre', 'created_at'].includes(qry.orderBy!) ? qry.orderBy! : 'id';
    const order = (qry.order === 'ASC' ? 'ASC' : 'DESC') as 'ASC' | 'DESC';
    qb.orderBy(`c.${orderBy}`, order);

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const tenantId = RequestContext.tenantId()!;
    const entity = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    if (!entity) throw new NotFoundException('Cliente no encontrado');
    return entity;
  }

  async update(id: number, dto: UpdateClienteDto) {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async activar(id: number) {
    const entity = await this.findOne(id);
    entity.activo = true;
    return this.repo.save(entity);
  }

  async desactivar(id: number) {
    const entity = await this.findOne(id);
    entity.activo = false;
    return this.repo.save(entity);
  }

  async remove(id: number) {
    const tenantId = RequestContext.tenantId()!;
    // soft delete
    const res = await this.repo.softDelete({ id, tenant_id: tenantId });
    if (!res.affected) throw new NotFoundException('Cliente no encontrado');
    return { ok: true };
  }
}
