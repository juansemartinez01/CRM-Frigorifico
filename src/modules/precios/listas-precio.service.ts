import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { RequestContext } from '../../common/request-context';
import { ListaPrecio } from './lista-precio.entity';
import { CreateListaDto } from './dto/create-lista.dto';
import { UpdateListaDto } from './dto/update-lista.dto';
import { QueryListaDto } from './dto/query-lista.dto';
import { Cliente } from '../clientes/cliente.entity';

@Injectable()
export class ListasPrecioService {
  constructor(
    @InjectRepository(ListaPrecio) private repo: Repository<ListaPrecio>,
    @InjectRepository(Cliente) private clientes: Repository<Cliente>,
  ) {}

  private async ensureCliente(tenantId: number, clienteId?: number | null) {
    if (!clienteId) return;
    const c = await this.clientes.findOne({ where: { id: clienteId, tenant_id: tenantId } });
    if (!c) throw new NotFoundException('Cliente no encontrado para esta lista');
  }

  async create(dto: CreateListaDto) {
    const tenantId = RequestContext.tenantId()!;
    if (dto.tipo === 'CLIENTE') {
      await this.ensureCliente(tenantId, dto.clienteId);
    } else {
      dto.clienteId = undefined;
    }

    const exists = await this.repo.findOne({ where: { tenant_id: tenantId, nombre: dto.nombre } });
    if (exists) throw new ConflictException('Ya existe una lista con ese nombre');

    const entity = this.repo.create({ ...dto, tenant_id: tenantId });
    return this.repo.save(entity);
  }

  async findAll(q: QueryListaDto) {
    const tenantId = RequestContext.tenantId()!;
    const qb = this.repo.createQueryBuilder('l').where('l.tenant_id = :tenantId', { tenantId });

    if (q.q) qb.andWhere('(l.nombre ILIKE :q OR l.moneda ILIKE :q OR l.notas ILIKE :q)', { q: `%${q.q}%` });
    if (q.tipo) qb.andWhere('l.tipo = :tipo', { tipo: q.tipo });
    if (q.clienteId) qb.andWhere('l.clienteId = :clienteId', { clienteId: q.clienteId });
    if (q.activo === 'true') qb.andWhere('l.activo = true');
    if (q.activo === 'false') qb.andWhere('l.activo = false');

    qb.orderBy(`l.${q.orderBy ?? 'nombre'}`, (q.order ?? 'ASC') as 'ASC'|'DESC');
    const page = q.page ?? 1, limit = q.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const tenantId = RequestContext.tenantId()!;
    const entity = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    if (!entity) throw new NotFoundException('Lista no encontrada');
    return entity;
  }

  async update(id: number, dto: UpdateListaDto) {
    const tenantId = RequestContext.tenantId()!;
    const entity = await this.findOne(id);

    if (dto.tipo === 'CLIENTE') {
      await this.ensureCliente(tenantId, dto.clienteId ?? entity.clienteId);
    }
    if (dto.nombre && dto.nombre !== entity.nombre) {
      const coll = await this.repo.findOne({ where: { tenant_id: tenantId, nombre: dto.nombre } });
      if (coll) throw new ConflictException('Nombre de lista ya usado');
    }

    Object.assign(entity, dto);
    return this.repo.save(entity);
  }

  async remove(id: number) {
    const tenantId = RequestContext.tenantId()!;
    const res = await this.repo.softDelete({ id, tenant_id: tenantId });
    if (!res.affected) throw new NotFoundException('Lista no encontrada');
    return { ok: true };
  }
}
