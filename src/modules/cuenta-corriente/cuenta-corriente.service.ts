import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { RequestContext } from '../../common/request-context';
import { MovimientoCC } from '../movimientos/movimiento.entity';
import { Cliente } from '../clientes/cliente.entity';
import { RemitoVenta } from '../remitos/entities/remito-venta.entity';
import { CobroAplicacion } from '../cobros/entities/cobro-aplicacion.entity';
import { Cobro } from '../cobros/entities/cobro.entity';
import { QuerySaldosDto } from './dto/query-saldos.dto';
import { QueryExtractoDto } from './dto/query-extracto.dto';

@Injectable()
export class CuentaCorrienteService {
  constructor(
    @InjectRepository(MovimientoCC) private movs: Repository<MovimientoCC>,
    @InjectRepository(Cliente) private clientes: Repository<Cliente>,
    @InjectRepository(RemitoVenta) private remitos: Repository<RemitoVenta>,
    @InjectRepository(CobroAplicacion) private apps: Repository<CobroAplicacion>,
    @InjectRepository(Cobro) private cobros: Repository<Cobro>,
  ) {}

  /** Totales DEBE/HABER y saldo de un cliente */
  async saldoCliente(clienteId: number) {
    const tenantId = RequestContext.tenantId()!;
    const exists = await this.clientes.findOne({ where: { id: clienteId, tenant_id: tenantId } });
    if (!exists) throw new NotFoundException('Cliente no encontrado');

    const { debe, haber } = await this.movs.createQueryBuilder('m')
      .select('COALESCE(SUM(CASE WHEN m.tipo = \'DEBE\' THEN m.monto::numeric ELSE 0 END),0)', 'debe')
      .addSelect('COALESCE(SUM(CASE WHEN m.tipo = \'HABER\' THEN m.monto::numeric ELSE 0 END),0)', 'haber')
      .where('m.tenant_id = :tenantId AND m.clienteId = :clienteId', { tenantId, clienteId })
      .getRawOne<{ debe: string; haber: string }>() ?? { debe: '0', haber: '0' };

    const saldo = Number(debe) - Number(haber);
    return {
      cliente: { id: exists.id, nombre: exists.nombre, cuit: exists.cuit },
      debe: Number(debe).toFixed(2),
      haber: Number(haber).toFixed(2),
      saldo: saldo.toFixed(2),
    };
  }

  /** Listado de saldos por cliente (paginado + filtros) */
  async saldos(q: QuerySaldosDto) {
    const tenantId = RequestContext.tenantId()!;
    const qb = this.clientes.createQueryBuilder('c')
      .select(['c.id AS id', 'c.nombre AS nombre', 'c.cuit AS cuit'])
      .addSelect('COALESCE(SUM(CASE WHEN m.tipo = \'DEBE\' THEN m.monto::numeric ELSE 0 END),0)', 'debe')
      .addSelect('COALESCE(SUM(CASE WHEN m.tipo = \'HABER\' THEN m.monto::numeric ELSE 0 END),0)', 'haber')
      .leftJoin(MovimientoCC, 'm', 'm.tenant_id = c.tenant_id AND m.clienteId = c.id')
      .where('c.tenant_id = :tenantId', { tenantId });

    if (q.q) qb.andWhere('(c.nombre ILIKE :q OR c.cuit ILIKE :q OR c.email ILIKE :q)', { q: `%${q.q}%` });

    qb.groupBy('c.id');
    let orderExpr = q.orderBy === 'saldo'
      ? '(COALESCE(SUM(CASE WHEN m.tipo = \'DEBE\' THEN m.monto::numeric ELSE 0 END),0) - COALESCE(SUM(CASE WHEN m.tipo = \'HABER\' THEN m.monto::numeric ELSE 0 END),0))'
      : `c.${q.orderBy ?? 'nombre'}`;
    qb.orderBy(orderExpr, (q.order ?? 'ASC') as 'ASC'|'DESC');

    const page = q.page ?? 1, limit = q.limit ?? 20;
    qb.offset((page - 1) * limit).limit(limit);

    const rows = await qb.getRawMany<{ id: number; nombre: string; cuit: string; debe: string; haber: string }>();
    const items = rows.map(r => ({
      id: Number(r.id),
      nombre: r.nombre,
      cuit: r.cuit,
      debe: Number(r.debe).toFixed(2),
      haber: Number(r.haber).toFixed(2),
      saldo: (Number(r.debe) - Number(r.haber)).toFixed(2),
    }));

    if (q.filtro === 'conSaldo') return { items: items.filter(i => Number(i.saldo) !== 0), page, limit };
    if (q.filtro === 'sinSaldo') return { items: items.filter(i => Number(i.saldo) === 0), page, limit };
    return { items, page, limit };
  }

  /** Extracto de movimientos con saldo acumulado */
  async extracto(clienteId: number, q: QueryExtractoDto) {
    const tenantId = RequestContext.tenantId()!;
    const exists = await this.clientes.findOne({ where: { id: clienteId, tenant_id: tenantId } });
    if (!exists) throw new NotFoundException('Cliente no encontrado');

    const where = ['m.tenant_id = :tenantId', 'm.clienteId = :clienteId'];
    const params: any = { tenantId, clienteId };
    if (q.desde) { where.push('m.fecha >= :desde'); params.desde = q.desde; }
    if (q.hasta) { where.push('m.fecha <= :hasta'); params.hasta = q.hasta; }

    // Usamos window function para saldo acumulado (DEBE = +, HABER = -)
    const rows = await this.movs.createQueryBuilder('m')
      .select([
        'm.id AS id',
        'm.fecha AS fecha',
        'm.tipo AS tipo',
        'm.origen AS origen',
        'm.referenciaId AS referenciaId',
        'm.monto::numeric AS monto',
        `SUM(CASE WHEN m.tipo = 'DEBE' THEN m.monto::numeric ELSE -m.monto::numeric END)
         OVER (ORDER BY m.fecha ${q.order ?? 'ASC'}, m.id ${q.order ?? 'ASC'}) AS saldo`,
      ])
      .where(where.join(' AND '), params)
      .orderBy('m.fecha', q.order ?? 'ASC')
      .addOrderBy('m.id', q.order ?? 'ASC')
      .offset(((q.page ?? 1) - 1) * (q.limit ?? 100))
      .limit(q.limit ?? 100)
      .getRawMany<{
        id: number; fecha: string; tipo: 'DEBE'|'HABER'; origen: string; referenciaId: number | null; monto: string; saldo: string;
      }>();

    return rows.map(r => ({
      id: Number(r.id),
      fecha: r.fecha,
      tipo: r.tipo,
      origen: r.origen,
      referenciaId: r.referenciaId ?? r.referenciaId ?? null,
      monto: Number(r.monto).toFixed(2),
      saldo: Number(r.saldo).toFixed(2),
    }));
  }

  /** Remitos abiertos (saldo > 0) para imputar cobros */
  async remitosAbiertos(clienteId: number) {
    const tenantId = RequestContext.tenantId()!;
    const exists = await this.clientes.findOne({ where: { id: clienteId, tenant_id: tenantId } });
    if (!exists) throw new NotFoundException('Cliente no encontrado');

    const qb = this.remitos.createQueryBuilder('r')
      .select([
        'r.id AS id',
        'r.fecha AS fecha',
        'r.numero AS numero',
        'r.total::numeric AS total',
        'COALESCE(SUM(a.monto::numeric),0) AS aplicado',
      ])
      .leftJoin(CobroAplicacion, 'a', 'a.remitoId = r.id')
      .leftJoin(Cobro, 'c', 'c.id = a.cobroId AND c.deleted_at IS NULL AND c.estado = \'CONFIRMADO\' AND c.tenant_id = r.tenant_id')
      .where('r.tenant_id = :tenantId AND r.clienteId = :clienteId AND r.deleted_at IS NULL', { tenantId, clienteId })
      .groupBy('r.id')
      .orderBy('r.fecha', 'ASC')
      .addOrderBy('r.numero', 'ASC');

    const rows = await qb.getRawMany<{ id: number; fecha: string; numero: number; total: string; aplicado: string }>();
    return rows
      .map(r => ({
        id: Number(r.id),
        fecha: r.fecha,
        numero: Number(r.numero),
        total: Number(r.total).toFixed(2),
        aplicado: Number(r.aplicado).toFixed(2),
        saldo: (Number(r.total) - Number(r.aplicado)).toFixed(2),
        dias: Math.max(0, Math.floor((Date.now() - new Date(r.fecha + 'T00:00:00').getTime()) / 86400000)),
      }))
      .filter(x => Number(x.saldo) > 0.0001);
  }
}
