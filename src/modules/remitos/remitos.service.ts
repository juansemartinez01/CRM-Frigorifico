import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { RequestContext } from '../../common/request-context';
import { RemitoVenta } from './entities/remito-venta.entity';
import { RemitoItem } from './entities/remito-item.entity';
import { CreateRemitoDto } from './dto/create-remito.dto';
import { UpdateRemitoDto } from './dto/update-remito.dto';
import { QueryRemitoDto } from './dto/query-remito.dto';
import { MovimientosService } from '../movimientos/movimientos.service';
import { Producto } from '../productos/producto.entity';
import { Cliente } from '../clientes/cliente.entity';

function toMoney(n: number) {
  return n.toFixed(2);
}

@Injectable()
export class RemitosService {
  constructor(
    @InjectRepository(RemitoVenta) private remitos: Repository<RemitoVenta>,
    @InjectRepository(RemitoItem) private items: Repository<RemitoItem>,
    @InjectRepository(Producto) private productos: Repository<Producto>,
    @InjectRepository(Cliente) private clientes: Repository<Cliente>,
    private readonly movs: MovimientosService,
    private readonly dataSource: DataSource,
  ) {}


  private async ensureCliente(tenantId: number, id: number) {
    const c = await this.clientes.findOne({ where: { id, tenant_id: tenantId } });
    if (!c) throw new NotFoundException('Cliente no encontrado');
  }

  private async ensureProducto(tenantId: number, id: number) {
    const p = await this.productos.findOne({ where: { id, tenant_id: tenantId } });
    if (!p) throw new NotFoundException(`Producto ${id} no encontrado`);
    return p;
  }

  private calcularTotales(items: { cantidad: string; precio: string }[]) {
    let subtotal = 0;
    for (const it of items) {
      const s = Number(it.cantidad) * Number(it.precio);
      subtotal += s;
    }
    const total = subtotal;
    return { subtotal: toMoney(subtotal), total: toMoney(total) };
  }

  async create(dto: CreateRemitoDto) {
  const tenantId = RequestContext.tenantId()!;
  await this.ensureCliente(tenantId, dto.clienteId);

  const saved = await this.dataSource.transaction(async (manager) => {
    const remRepo  = manager.getRepository(RemitoVenta);
    const itemRepo = manager.getRepository(RemitoItem);
    const prodRepo = manager.getRepository(Producto);

    const numero = await this.nextNumeroLocked(manager, tenantId);

    // Armar ítems normalizando decimales
    const items: RemitoItem[] = [];
    for (const raw of dto.items) {
      const prod = await prodRepo.findOne({ where: { id: raw.productoId, tenant_id: tenantId } });
      if (!prod) throw new NotFoundException(`Producto ${raw.productoId} no encontrado`);
      const desc = raw.descripcion ?? prod.nombre;

      const cantNum = Number(raw.cantidad);
      const precNum = Number(raw.precio);
      if (!isFinite(cantNum) || !isFinite(precNum)) {
        throw new BadRequestException('cantidad/precio inválidos');
      }
      const cantidad = cantNum.toFixed(3);
      const precio   = precNum.toFixed(2);
      const subtotal = (cantNum * precNum).toFixed(2);

      items.push(itemRepo.create({
        tenant_id: tenantId,
        productoId: raw.productoId,
        descripcion: desc,
        cantidad,
        precio,
        subtotal,
      }));
    }

    const subtotalNum = items.reduce((acc, it) => acc + Number(it.subtotal), 0);
    const totales = { subtotal: subtotalNum.toFixed(2), total: subtotalNum.toFixed(2) };

    const rem = remRepo.create({
      tenant_id: tenantId,
      fecha: dto.fecha,
      numero,
      clienteId: dto.clienteId,
      usuarioId: dto.usuarioId ?? null,
      observaciones: dto.observaciones,
      subtotal: totales.subtotal,
      total: totales.total,
      estado: 'CONFIRMADO',
      items,
    });

    return remRepo.save(rem);
  });

  // Movimiento en CC fuera de la tx (si querés, también puede ir adentro)
  await this.movs.crear({
    clienteId: saved.clienteId,
    fecha: saved.fecha,
    tipo: 'DEBE',
    origen: 'REMITO',
    referenciaId: saved.id,
    monto: saved.total,
    observaciones: `Remito ${saved.numero}`,
  });

  return saved;
}


  async findAll(q: QueryRemitoDto) {
    const tenantId = RequestContext.tenantId()!;
    const qb = this.remitos.createQueryBuilder('r')
      .leftJoinAndSelect('r.items', 'i')
      .leftJoinAndSelect('r.cliente', 'c')
      .where('r.tenant_id = :tenantId', { tenantId });

    if (q.clienteId) qb.andWhere('r.clienteId = :cid', { cid: q.clienteId });
    if (q.numeroLike) qb.andWhere('CAST(r.numero AS TEXT) ILIKE :n', { n: `%${q.numeroLike}%` });
    if (q.estado) qb.andWhere('r.estado = :e', { e: q.estado });
    if (q.desde) qb.andWhere('r.fecha >= :d', { d: q.desde });
    if (q.hasta) qb.andWhere('r.fecha <= :h', { h: q.hasta });

    qb.orderBy(`r.${q.orderBy ?? 'fecha'}`, (q.order ?? 'DESC') as 'ASC'|'DESC');
    const page = q.page ?? 1, limit = q.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const tenantId = RequestContext.tenantId()!;
    const r = await this.remitos.findOne({ where: { id, tenant_id: tenantId }, relations: ['items', 'cliente'] });
    if (!r) throw new NotFoundException('Remito no encontrado');
    return r;
  }

  async update(id: number, dto: UpdateRemitoDto) {
    const tenantId = RequestContext.tenantId()!;
    const rem = await this.findOne(id);
    if (dto.clienteId) await this.ensureCliente(tenantId, dto.clienteId);

    // Reemplazo de detalle si viene items
    if (dto.items) {
      // borrar items actuales y crear nuevos
      await this.items.delete({ tenant_id: tenantId, remitoId: rem.id });
      const nuevos: RemitoItem[] = [];
      for (const raw of dto.items) {
        const prod = await this.ensureProducto(tenantId, raw.productoId);
        const descripcion = raw.descripcion ?? prod.nombre;
        const subtotal = toMoney(Number(raw.cantidad) * Number(raw.precio));
        nuevos.push(
          this.items.create({
            tenant_id: tenantId,
            remitoId: rem.id,
            productoId: raw.productoId,
            descripcion,
            cantidad: raw.cantidad,
            precio: raw.precio,
            subtotal,
          }),
        );
      }
      rem.items = await this.items.save(nuevos);
      const tot = this.calcularTotales(nuevos.map(i => ({ cantidad: i.cantidad, precio: i.precio })));
      rem.subtotal = tot.subtotal;
      rem.total = tot.total;
    }

    Object.assign(rem, {
      fecha: dto.fecha ?? rem.fecha,
      clienteId: dto.clienteId ?? rem.clienteId,
      usuarioId: dto.usuarioId ?? rem.usuarioId,
      observaciones: dto.observaciones ?? rem.observaciones,
    });

    const updated = await this.remitos.save(rem);

    // Ajuste en CC: revertemos el asiento anterior y cargamos nuevo con el total actualizado
    await this.movs.revertirDe('REMITO', updated.id, 'Reverso por actualización de remito');
    await this.movs.crear({
      clienteId: updated.clienteId,
      fecha: updated.fecha,
      tipo: 'DEBE',
      origen: 'REMITO',
      referenciaId: updated.id,
      monto: updated.total,
      observaciones: `Remito ${updated.numero} (actualizado)`,
    });

    return updated;
  }

  async remove(id: number) {
    const tenantId = RequestContext.tenantId()!;
    const rem = await this.findOne(id);
    await this.remitos.softDelete({ id: rem.id, tenant_id: tenantId });
    // Contra-asiento HABER para anular deuda
    await this.movs.revertirDe('REMITO', rem.id, 'Reverso por anulación de remito');
    return { ok: true };
  }


  private async nextNumeroLocked(manager: EntityManager, tenantId: number): Promise<number> {
  // Lock por tenant (se libera al cerrar la transacción)
  await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [1001, tenantId]);

  // 👇 Incluir borrados lógicos para NO reutilizar números
  const result = await manager
    .getRepository(RemitoVenta)
    .createQueryBuilder('r')
    .withDeleted() // <<=== IMPORTANTE
    .select('COALESCE(MAX(r.numero), 0)', 'max')
    .where('r.tenant_id = :tenantId', { tenantId })
    .getRawOne<{ max: string }>();

  const max = result?.max ?? '0';
  return Number(max) + 1;
}

}
