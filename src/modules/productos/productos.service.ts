import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { RequestContext } from '../../common/request-context';
import { Producto } from './producto.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { QueryProductoDto } from './dto/query-producto.dto';
import { Unidad } from '../unidades/unidad.entity';


function isPgUnique(e: any) {
  return e instanceof QueryFailedError && String((e as any).driverError?.code) === '23505';
}

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto) private repo: Repository<Producto>,
    @InjectRepository(Unidad) private unidades: Repository<Unidad>,
  ) {}

  private async ensureUnidad(tenantId: number, unidadId: number) {
    const u = await this.unidades.findOne({ where: { id: unidadId, tenant_id: tenantId } });
    if (!u) throw new NotFoundException('Unidad no encontrada en este tenant');
    return u;
  }

  

  async create(dto: CreateProductoDto) {
  try {
    const entity = this.repo.create(dto as any);
    return await this.repo.save(entity);
  } catch (e) {
    if (isPgUnique(e)) throw new ConflictException('Producto duplicado (nombre+unidad o SKU)');
    throw e;
  }
}

  async findAll(q: QueryProductoDto) {
    const tenantId = RequestContext.tenantId()!;
    const qb = this.repo.createQueryBuilder('p')
      .leftJoinAndSelect('p.unidad', 'u')
      .where('p.tenant_id = :tenantId', { tenantId });

    if (q.q) qb.andWhere('(p.nombre ILIKE :q OR p.sku ILIKE :q OR p.descripcion ILIKE :q)', { q: `%${q.q}%` });
    if (q.unidadId) qb.andWhere('p.unidadId = :unidadId', { unidadId: q.unidadId });

    qb.orderBy(`p.${q.orderBy ?? 'nombre'}`, (q.order ?? 'ASC') as 'ASC'|'DESC');
    const page = q.page ?? 1, limit = q.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const tenantId = RequestContext.tenantId()!;
    const entity = await this.repo.findOne({ where: { id, tenant_id: tenantId }, relations: ['unidad'] });
    if (!entity) throw new NotFoundException('Producto no encontrado');
    return entity;
  }

  async update(id: number, dto: UpdateProductoDto) {
  const entity = await this.repo.findOneBy({ id, tenant_id: RequestContext.tenantId()! });
  if (!entity) throw new NotFoundException('Producto no encontrado');
  Object.assign(entity, dto);
  try {
    return await this.repo.save(entity);
  } catch (e) {
    if (isPgUnique(e)) throw new ConflictException('Producto duplicado (nombre+unidad o SKU)');
    throw e;
  }
}

  async remove(id: number) {
    const tenantId = RequestContext.tenantId()!;
    const res = await this.repo.softDelete({ id, tenant_id: tenantId });
    if (!res.affected) throw new NotFoundException('Producto no encontrado');
    return { ok: true };
  }
}
