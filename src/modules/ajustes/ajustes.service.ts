import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { RequestContext } from '../../common/request-context';
import { AjusteCC } from './entities/ajuste-cc.entity';
import { CreateAjusteDto } from './dto/create-ajuste.dto';
import { UpdateAjusteDto } from './dto/update-ajuste.dto';
import { QueryAjusteDto } from './dto/query-ajuste.dto';
import { Cliente } from '../clientes/cliente.entity';
import { MovimientosService } from '../movimientos/movimientos.service';

function toMoney(n: number) { return n.toFixed(2); }

@Injectable()
export class AjustesService {
  constructor(
    @InjectRepository(AjusteCC) private repo: Repository<AjusteCC>,
    @InjectRepository(Cliente) private clientes: Repository<Cliente>,
    private readonly dataSource: DataSource,
    private readonly movs: MovimientosService,
  ) {}

  private async ensureCliente(tenantId: number, id: number) {
    const c = await this.clientes.findOne({ where: { id, tenant_id: tenantId } });
    if (!c) throw new NotFoundException('Cliente no encontrado');
  }

  private async nextNumeroLocked(manager: EntityManager, tenantId: number): Promise<number> {
    // lock transaccional por tenant para "AJUSTE" (namespace 1002)
    await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [1002, tenantId]);
    const { max } = await manager.getRepository(AjusteCC)
      .createQueryBuilder('a').withDeleted()
      .select('COALESCE(MAX(a.numero), 0)', 'max')
      .where('a.tenant_id = :tenantId', { tenantId })
      .getRawOne<{ max: string }>() ?? { max: '0' };
    return Number(max) + 1;
  }

  async create(dto: CreateAjusteDto) {
    const tenantId = RequestContext.tenantId()!;
    await this.ensureCliente(tenantId, dto.clienteId);

    const saved = await this.dataSource.transaction(async (manager) => {
      const numero = await this.nextNumeroLocked(manager, tenantId);
      const montoNum = Number(dto.monto);
      if (!isFinite(montoNum) || montoNum <= 0) throw new BadRequestException('monto inválido');

      const e = manager.getRepository(AjusteCC).create({
        tenant_id: tenantId,
        fecha: dto.fecha,
        numero,
        clienteId: dto.clienteId,
        tipo: dto.tipo,
        motivo: dto.motivo,
        monto: toMoney(montoNum),
        observaciones: dto.observaciones,
        estado: 'CONFIRMADO',
      });
      return manager.getRepository(AjusteCC).save(e);
    });

    // Movimiento en Cta Cte
    await this.movs.crear({
      clienteId: saved.clienteId,
      fecha: saved.fecha,
      tipo: saved.tipo, // DEBE/HABER según ajuste
      origen: 'AJUSTE',
      referenciaId: saved.id,
      monto: saved.monto,
      observaciones: `Ajuste ${saved.numero} (${saved.motivo})`,
    });

    return saved;
  }

  async findAll(q: QueryAjusteDto) {
    const tenantId = RequestContext.tenantId()!;
    const qb = this.repo.createQueryBuilder('a').where('a.tenant_id = :tenantId', { tenantId });
    if (q.clienteId) qb.andWhere('a.clienteId = :cid', { cid: q.clienteId });
    if (q.tipo) qb.andWhere('a.tipo = :t', { t: q.tipo });
    if (q.estado) qb.andWhere('a.estado = :e', { e: q.estado });
    if (q.desde) qb.andWhere('a.fecha >= :d', { d: q.desde });
    if (q.hasta) qb.andWhere('a.fecha <= :h', { h: q.hasta });

    qb.orderBy(`a.${q.orderBy ?? 'fecha'}`, (q.order ?? 'DESC') as any);
    const page = q.page ?? 1, limit = q.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);
    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const tenantId = RequestContext.tenantId()!;
    const e = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
    if (!e) throw new NotFoundException('Ajuste no encontrado');
    return e;
  }

  async update(id: number, dto: UpdateAjusteDto) {
    const e = await this.findOne(id);
    if (e.estado === 'ANULADO') throw new ConflictException('No se puede modificar un ajuste anulado');

    const nuevo = { ...e };
    if (dto.fecha) nuevo.fecha = dto.fecha;
    if (dto.tipo)  nuevo.tipo  = dto.tipo;
    if (dto.motivo) nuevo.motivo = dto.motivo;
    if (dto.monto !== undefined) {
      const m = Number(dto.monto);
      if (!isFinite(m) || m <= 0) throw new BadRequestException('monto inválido');
      nuevo.monto = toMoney(m);
    }
    if (dto.observaciones !== undefined) nuevo.observaciones = dto.observaciones;

    // Revertimos movimiento anterior y creamos el nuevo
    await this.movs.revertirDe('AJUSTE', e.id, 'Reverso por actualización de ajuste');

    Object.assign(e, nuevo);
    const saved = await this.repo.save(e);

    await this.movs.crear({
      clienteId: saved.clienteId,
      fecha: saved.fecha,
      tipo: saved.tipo,
      origen: 'AJUSTE',
      referenciaId: saved.id,
      monto: saved.monto,
      observaciones: `Ajuste ${saved.numero} (actualizado)`,
    });
    return saved;
  }

  async anular(id: number) {
    const e = await this.findOne(id);
    if (e.estado === 'ANULADO') return e;
    e.estado = 'ANULADO';
    const saved = await this.repo.save(e);
    await this.movs.revertirDe('AJUSTE', saved.id, 'Anulación de ajuste');
    return saved;
  }

  async remove(id: number) {
    const tenantId = RequestContext.tenantId()!;
    const e = await this.findOne(id);
    await this.repo.softDelete({ id: e.id, tenant_id: tenantId });
    await this.movs.revertirDe('AJUSTE', e.id, 'Baja lógica de ajuste');
    return { ok: true };
  }
}
