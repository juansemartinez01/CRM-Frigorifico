import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RequestContext } from '../../common/request-context';
import { PrecioProducto } from './precio-producto.entity';
import { CreatePrecioDto } from './dto/create-precio.dto';
import { UpdatePrecioDto } from './dto/update-precio.dto';
import { QueryPrecioDto } from './dto/query-precio.dto';
import { ListaPrecio } from './lista-precio.entity';
import { Producto } from '../productos/producto.entity';

@Injectable()
export class PreciosService {
  constructor(
    @InjectRepository(PrecioProducto) private repo: Repository<PrecioProducto>,
    @InjectRepository(ListaPrecio) private listas: Repository<ListaPrecio>,
    @InjectRepository(Producto) private productos: Repository<Producto>,
  ) {}

  private async ensureLista(tenantId: number, listaId: number) {
    const l = await this.listas.findOne({ where: { id: listaId, tenant_id: tenantId } });
    if (!l) throw new NotFoundException('Lista de precios no encontrada');
    return l;
  }

  private async ensureProducto(tenantId: number, productoId: number) {
    const p = await this.productos.findOne({ where: { id: productoId, tenant_id: tenantId } });
    if (!p) throw new NotFoundException('Producto no encontrado');
    return p;
  }

  // Chequea solapamientos de vigencia para la misma lista+producto
  private async checkOverlap(
  tenantId: number,
  listaId: number,
  productoId: number,
  desde: string,
  hasta?: string | null,
  excludeId?: number,
) {
  const qb = this.repo.createQueryBuilder('pp')
    .where('pp.tenant_id = :tenantId', { tenantId })
    .andWhere('pp.listaId = :listaId', { listaId })
    .andWhere('pp.productoId = :productoId', { productoId })
    .andWhere('pp.deleted_at IS NULL');

  if (excludeId) qb.andWhere('pp.id != :id', { id: excludeId });

  // Condición de solapamiento SIN pasar parámetros nulos:
  // Solapa si: (COALESCE(pp.hasta, ∞) >= desde) AND (pp.desde <= COALESCE(hasta, ∞))
  qb.andWhere(`COALESCE(pp.vigenciaHasta, DATE '9999-12-31') >= :desde::date`, { desde });

  const upper = hasta ?? '9999-12-31';
  qb.andWhere(`pp.vigenciaDesde <= :upper::date`, { upper });

  const exists = await qb.getCount();
  if (exists > 0) {
    throw new ConflictException(
      'Ya existe un precio vigente que se solapa para este producto en esa lista',
    );
  }
}

  async create(listaId: number, dto: CreatePrecioDto) {
    const tenantId = RequestContext.tenantId()!;
    await this.ensureLista(tenantId, listaId);
    await this.ensureProducto(tenantId, dto.productoId);

    if (dto.vigenciaHasta && dto.vigenciaHasta < dto.vigenciaDesde) {
      throw new ConflictException('vigenciaHasta no puede ser menor que vigenciaDesde');
    }

    await this.checkOverlap(tenantId, listaId, dto.productoId, dto.vigenciaDesde, dto.vigenciaHasta ?? null);
    const entity = this.repo.create({ ...dto, listaId, tenant_id: tenantId });
    return this.repo.save(entity);
  }

  async findAll(listaId: number, q: QueryPrecioDto) {
    const tenantId = RequestContext.tenantId()!;
    await this.ensureLista(tenantId, listaId);

    const qb = this.repo.createQueryBuilder('pp')
      .leftJoinAndSelect('pp.producto', 'p')
      .where('pp.tenant_id = :tenantId', { tenantId })
      .andWhere('pp.listaId = :listaId', { listaId });

    if (q.productoId) qb.andWhere('pp.productoId = :productoId', { productoId: q.productoId });
    if (q.vigenciaEn) {
      qb.andWhere('pp.vigenciaDesde <= :fecha', { fecha: q.vigenciaEn })
        .andWhere('(pp.vigenciaHasta IS NULL OR pp.vigenciaHasta >= :fecha)', { fecha: q.vigenciaEn });
    }

    qb.orderBy(`pp.${q.orderBy ?? 'vigenciaDesde'}`, (q.order ?? 'DESC') as 'ASC'|'DESC');
    const page = q.page ?? 1, limit = q.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(listaId: number, id: number) {
    const tenantId = RequestContext.tenantId()!;
    await this.ensureLista(tenantId, listaId);
    const entity = await this.repo.findOne({ where: { id, tenant_id: tenantId, listaId } });
    if (!entity) throw new NotFoundException('Precio no encontrado');
    return entity;
  }

  async update(listaId: number, id: number, dto: UpdatePrecioDto) {
    const tenantId = RequestContext.tenantId()!;
    const entity = await this.findOne(listaId, id);

    const vigDesde = dto.vigenciaDesde ?? entity.vigenciaDesde;
    const vigHasta = dto.vigenciaHasta ?? entity.vigenciaHasta ?? null;
    if (vigHasta && vigHasta < vigDesde) {
      throw new ConflictException('vigenciaHasta no puede ser menor que vigenciaDesde');
    }

    await this.checkOverlap(tenantId, listaId, entity.productoId, vigDesde, vigHasta, id);
    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(listaId: number, id: number) {
    const tenantId = RequestContext.tenantId()!;
    const res = await this.repo.softDelete({ id, tenant_id: tenantId, listaId });
    if (!res.affected) throw new NotFoundException('Precio no encontrado');
    return { ok: true };
  }
}
