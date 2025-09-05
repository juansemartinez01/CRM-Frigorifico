import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { RequestContext } from '../../common/request-context';
import { Cobro } from './entities/cobro.entity';
import { CobroAplicacion } from './entities/cobro-aplicacion.entity';
import { MedioCobro } from './entities/medio-cobro.entity';
import { CreateCobroDto } from './dto/create-cobro.dto';
import { UpdateCobroDto } from './dto/update-cobro.dto';
import { QueryCobroDto } from './dto/query-cobro.dto';
import { Cliente } from '../clientes/cliente.entity';
import { RemitoVenta } from '../remitos/entities/remito-venta.entity';
import { MovimientosService } from '../movimientos/movimientos.service';

function toMoney(n: number) { return n.toFixed(2); }

@Injectable()
export class CobrosService {
  constructor(
    @InjectRepository(Cobro) private cobros: Repository<Cobro>,
    @InjectRepository(CobroAplicacion) private apps: Repository<CobroAplicacion>,
    @InjectRepository(MedioCobro) private medios: Repository<MedioCobro>,
    @InjectRepository(Cliente) private clientes: Repository<Cliente>,
    @InjectRepository(RemitoVenta) private remitos: Repository<RemitoVenta>,
    private readonly movs: MovimientosService,
    private readonly dataSource: DataSource, 
  ) {}

  private async nextNumero(tenantId: number): Promise<number> {
    const { max } = await this.cobros
      .createQueryBuilder('c')
      .select('COALESCE(MAX(c.numero), 0)', 'max')
      .where('c.tenant_id = :tenantId', { tenantId })
      .getRawOne<{ max: string }>() ?? { max: '0' };
    return Number(max) + 1;
  }

  private async nextNumeroLocked(m: EntityManager, tenantId: number): Promise<number> {
  await m.query('SELECT pg_advisory_xact_lock($1, $2)', [1003, tenantId]); // namespace para COBRO
  const { max } = await m.getRepository(Cobro)
    .createQueryBuilder('c').withDeleted()
    .select('COALESCE(MAX(c.numero), 0)', 'max')
    .where('c.tenant_id = :tenantId', { tenantId })
    .getRawOne<{ max: string }>() ?? { max: '0' };
  return Number(max) + 1;
}

  private async ensureCliente(tenantId: number, id: number) {
    const c = await this.clientes.findOne({ where: { id, tenant_id: tenantId } });
    if (!c) throw new NotFoundException('Cliente no encontrado');
  }

  private async ensureMedio(tenantId: number, id: number) {
    const m = await this.medios.findOne({ where: { id, tenant_id: tenantId } });
    if (!m) throw new NotFoundException('Medio de cobro no encontrado');
  }

  private async ensureRemito(tenantId: number, id: number) {
    const r = await this.remitos.findOne({ where: { id, tenant_id: tenantId } });
    if (!r) throw new NotFoundException('Remito no encontrado');
    return r;
  }

  private async saldoRemito(tenantId: number, remitoId: number): Promise<number> {
    const rem = await this.ensureRemito(tenantId, remitoId);
    const total = Number(rem.total);

    const { sum } = await this.apps.createQueryBuilder('a')
      .innerJoin('a.cobro', 'c', 'c.id = a.cobroId AND c.deleted_at IS NULL AND c.tenant_id = :tenantId', { tenantId })
      .select('COALESCE(SUM(a.monto::numeric), 0)', 'sum')
      .where('a.remitoId = :remitoId', { remitoId })
      .getRawOne<{ sum: string }>() ?? { sum: '0' };

    const aplicado = Number(sum || 0);
    return total - aplicado;
  }

  private validarAplicacionesDelCliente(remitos: RemitoVenta[], clienteId: number) {
    for (const r of remitos) if (r.clienteId !== clienteId) {
      throw new ConflictException(`El remito ${r.id} pertenece a otro cliente`);
    }
  }

  async create(dto: CreateCobroDto) {
    const tenantId = RequestContext.tenantId()!;
    await this.ensureCliente(tenantId, dto.clienteId);
    await this.ensureMedio(tenantId, dto.medioId);

    return await this.dataSource.transaction(async (m) => {
      const numero = await this.nextNumeroLocked(m, tenantId);
      const montoNum = Number(dto.monto);
      if (!isFinite(montoNum) || montoNum <= 0) throw new BadRequestException('monto inválido');

      // Validaciones de aplicaciones
      
      const remitosIds = Array.from(new Set((dto.aplicaciones ?? []).map(a => Number(a.remitoId)))).filter(Boolean);
      const remitos = remitosIds.length
        ? await this.remitos.find({ where: { tenant_id: tenantId, id: In(remitosIds) } })
        : [];

      if (remitosIds.length && remitos.length !== remitosIds.length) {
        throw new NotFoundException('Algún remito no existe en este tenant');
      }
      if (remitos.length) this.validarAplicacionesDelCliente(remitos, dto.clienteId);

      let sumApps = 0;
      for (const a of dto.aplicaciones ?? []) {
        const saldo = await this.saldoRemito(tenantId, a.remitoId);
        const aNum = Number(a.monto);
        if (!isFinite(aNum) || aNum <= 0) throw new BadRequestException('Monto de imputación inválido');
        if (aNum > saldo + 0.0001) throw new ConflictException(`Imputación excede saldo del remito ${a.remitoId}`);
        sumApps += aNum;
      }
      if (sumApps - montoNum > 0.0001) {
        throw new ConflictException('La suma de imputaciones supera el monto del cobro');
      }
      // Nota: Permitimos que sumApps < montoNum (quedará crédito del cliente)

      const cobro = this.cobros.create({
        tenant_id: tenantId,
        fecha: dto.fecha,
        numero,
        clienteId: dto.clienteId,
        medioId: dto.medioId,
        comprobante: dto.comprobante ?? null,
        monto: toMoney(montoNum),
        observaciones: dto.observaciones,
        estado: 'CONFIRMADO',
        aplicaciones: (dto.aplicaciones ?? []).map(a => this.apps.create({
          tenant_id: tenantId,
          remitoId: a.remitoId,
          monto: toMoney(Number(a.monto)),
        })),
      });
      const saved = await m.getRepository(Cobro).save(cobro);

      // Movimiento HABER en cuenta corriente
      await this.movs?.crear({
        clienteId: saved.clienteId,
        fecha: saved.fecha,
        tipo: 'HABER',
        origen: 'COBRO',
        referenciaId: saved.id,
        monto: saved.monto,
        observaciones: `Cobro ${saved.numero}`,
      });

      return saved;
    });
  }

  async findAll(q: QueryCobroDto) {
    const tenantId = RequestContext.tenantId()!;
    const qb = this.cobros.createQueryBuilder('c')
      .leftJoinAndSelect('c.aplicaciones', 'a')
      .leftJoinAndSelect('c.medio', 'm')
      .leftJoinAndSelect('c.cliente', 'cli')
      .where('c.tenant_id = :tenantId', { tenantId });

    if (q.clienteId) qb.andWhere('c.clienteId = :cid', { cid: q.clienteId });
    if (q.medioId) qb.andWhere('c.medioId = :mid', { mid: q.medioId });
    if (q.numeroLike) qb.andWhere('CAST(c.numero AS TEXT) ILIKE :n', { n: `%${q.numeroLike}%` });
    if (q.desde) qb.andWhere('c.fecha >= :d', { d: q.desde });
    if (q.hasta) qb.andWhere('c.fecha <= :h', { h: q.hasta });

    qb.orderBy(`c.${q.orderBy ?? 'fecha'}`, (q.order ?? 'DESC') as 'ASC'|'DESC');
    const page = q.page ?? 1, limit = q.limit ?? 20;
    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();
    return { items, total, page, limit };
  }

  async findOne(id: number) {
    const tenantId = RequestContext.tenantId()!;
    const c = await this.cobros.findOne({ where: { id, tenant_id: tenantId }, relations: ['aplicaciones', 'medio', 'cliente'] });
    if (!c) throw new NotFoundException('Cobro no encontrado');
    return c;
  }

  async update(id: number, dto: UpdateCobroDto) {
    const tenantId = RequestContext.tenantId()!;
    const cobro = await this.findOne(id);

    if (dto.medioId) await this.ensureMedio(tenantId, dto.medioId);

    // Validaciones de aplicaciones (si reemplaza)
    if (dto.aplicaciones) {
      // validar cliente y saldos
        
        const ids = Array.from(new Set(dto.aplicaciones.map(a => Number(a.remitoId)))).filter(Boolean);
        const rems = ids.length ? await this.remitos.find({ where: { tenant_id: tenantId, id: In(ids) } }) : [];

      if (ids.length && rems.length !== ids.length) throw new NotFoundException('Algún remito no existe');
      if (rems.length) this.validarAplicacionesDelCliente(rems, cobro.clienteId);

      const montoNum = Number(dto.monto ?? cobro.monto);
      let sumApps = 0;
      for (const a of dto.aplicaciones) {
        // saldo disponible debe considerar que este cobro ya había aplicado antes.
        const saldoActual = await this.saldoRemito(tenantId, a.remitoId);
        // recupera lo aplicado por ESTE cobro a ese remito (para permitir reimputar mismo monto)
        const aplicadoPorEste = Number(
          cobro.aplicaciones.find(x => x.remitoId === a.remitoId)?.monto ?? '0',
        );
        const saldoDisponible = saldoActual + aplicadoPorEste;

        const aNum = Number(a.monto);
        if (!isFinite(aNum) || aNum <= 0) throw new BadRequestException('Monto de imputación inválido');
        if (aNum > saldoDisponible + 0.0001) throw new ConflictException(`Imputación excede saldo del remito ${a.remitoId}`);
        sumApps += aNum;
      }
      if (sumApps - montoNum > 0.0001) throw new ConflictException('La suma de imputaciones supera el monto del cobro');

      // Reemplazar aplicaciones: borrar detalle anterior y crear nuevo
      await this.apps.delete({ tenant_id: tenantId, cobroId: cobro.id });
      cobro.aplicaciones = dto.aplicaciones.map(a => this.apps.create({
        tenant_id: tenantId,
        cobroId: cobro.id,
        remitoId: a.remitoId,
        monto: toMoney(Number(a.monto)),
      }));
    }

    Object.assign(cobro, {
      fecha: dto.fecha ?? cobro.fecha,
      medioId: dto.medioId ?? cobro.medioId,
      comprobante: dto.comprobante ?? cobro.comprobante,
      monto: dto.monto ? toMoney(Number(dto.monto)) : cobro.monto,
      observaciones: dto.observaciones ?? cobro.observaciones,
    });

    const updated = await this.cobros.save(cobro);

    // Ajustar Cta Cte: contra-asiento + nuevo asiento HABER
    await this.movs.revertirDe('COBRO', updated.id, 'Reverso por actualización de cobro');
    await this.movs.crear({
      clienteId: updated.clienteId,
      fecha: updated.fecha,
      tipo: 'HABER',
      origen: 'COBRO',
      referenciaId: updated.id,
      monto: updated.monto,
      observaciones: `Cobro ${updated.numero} (actualizado)`,
    });

    return updated;
  }

  async remove(id: number) {
    const tenantId = RequestContext.tenantId()!;
    const c = await this.findOne(id);
    await this.cobros.softDelete({ id: c.id, tenant_id: tenantId });
    // Contra-asiento DEBE para anular crédito
    await this.movs.revertirDe('COBRO', c.id, 'Reverso por anulación de cobro');
    return { ok: true };
  }
}
