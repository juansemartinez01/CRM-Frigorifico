import { Injectable, Scope, Inject, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { REQUEST } from '@nestjs/core';
import { Request } from 'express';
import { Repository } from 'typeorm';

import { getTenantIdFromReq } from '@app/common/multi-tenant/tenant.util';
import { EstadisticasFiltroDto } from './dto/estadisticas-filtro.dto';

import { Pedido } from '@app/modules/pedido/pedido.entity';
import { MovimientoCuentaCorriente } from '@app/modules/mov-cta-cte/movimiento-cta-cte.entity';
import { CuentaCorriente } from '@app/modules/cuenta-corriente/cuenta-corriente.entity';
import { Cliente } from '@app/modules/cliente/cliente.entity';

@Injectable({ scope: Scope.REQUEST })
export class EstadisticasService {
  constructor(
    @InjectRepository(Pedido) private readonly pedidoRepo: Repository<Pedido>,
    @InjectRepository(MovimientoCuentaCorriente)
    private readonly movRepo: Repository<MovimientoCuentaCorriente>,
    @InjectRepository(CuentaCorriente)
    private readonly ccRepo: Repository<CuentaCorriente>,
    @InjectRepository(Cliente)
    private readonly clienteRepo: Repository<Cliente>,
    @Inject(REQUEST) private readonly req: Request,
  ) {}

  private tenantId() {
    return getTenantIdFromReq(this.req);
  }

  // =========================
  // 1) DEUDA POR CLIENTE
  // =========================
  async deudaPorCliente(f: EstadisticasFiltroDto) {
    const { fechaDesde, fechaHasta } = f;
    const tenantId = this.tenantId();

    // Ventas (solo confirmadas) por cliente en rango
    // Sumamos monto de movimientos tipo VENTA que estén asociados a pedidos confirmados en rango
    const ventasQb = this.movRepo
      .createQueryBuilder('m')
      .select('m.clienteId', 'clienteId')
      .addSelect('COALESCE(SUM(m.monto::numeric), 0)::text', 'ventas')
      .leftJoin('m.pedido', 'p')
      .where('m.tenantId = :tenantId', { tenantId })
      .andWhere('m.tipo = :venta', { venta: 'VENTA' })
      .andWhere('p.id IS NOT NULL') // solo movimientos ligados a pedido
      .andWhere('p.confirmado = true')
      .andWhere('p.fechaRemito BETWEEN :fd AND :fh', {
        fd: fechaDesde,
        fh: fechaHasta,
      })
      .groupBy('m.clienteId');

    const ventasRaw = await ventasQb.getRawMany<{
      clienteId: string;
      ventas: string;
    }>();
    const ventasMap = new Map(ventasRaw.map((r) => [r.clienteId, r.ventas]));

    // Cobros por cliente en rango
    const cobrosQb = this.movRepo
      .createQueryBuilder('m')
      .select('m.clienteId', 'clienteId')
      .addSelect('COALESCE(SUM(m.monto::numeric), 0)::text', 'cobros')
      .where('m.tenantId = :tenantId', { tenantId })
      .andWhere('m.tipo = :cobro', { cobro: 'COBRO' })
      .andWhere('m.fecha BETWEEN :fd AND :fh', {
        fd: fechaDesde,
        fh: fechaHasta,
      })
      .groupBy('m.clienteId');

    const cobrosRaw = await cobrosQb.getRawMany<{
      clienteId: string;
      cobros: string;
    }>();
    const cobrosMap = new Map(cobrosRaw.map((r) => [r.clienteId, r.cobros]));

    // Traer clientes del tenant para armar lista consistente
    const clientes = await this.clienteRepo.find({
      where: { tenantId },
    });

    // Construir filas y ordenar por deudaPeriodo DESC
    const filas = await Promise.all(
      clientes.map(async (c) => {
        const ventas = Number(ventasMap.get(c.id) ?? '0');
        const cobros = Number(cobrosMap.get(c.id) ?? '0');
        const deudaPeriodo = +(ventas - cobros).toFixed(2);

        // saldo actual (opcional, fuera de rango; útil para UI)
        const cc = await this.ccRepo.findOne({
          where: { tenantId, clienteId: c.id },
        });
        const saldoActual = cc?.saldo ?? '0.00';

        return {
          cliente: c,
          ventasPeriodo: ventas.toFixed(2),
          cobrosPeriodo: cobros.toFixed(2),
          deudaPeriodo: deudaPeriodo.toFixed(2),
          saldoActual, // si querés mostrar “morosidad actual”
        };
      }),
    );

    // Orden de "más moroso a menos" por deudaPeriodo
    filas.sort((a, b) => Number(b.deudaPeriodo) - Number(a.deudaPeriodo));

    return {
      ok: true,
      fechaDesde,
      fechaHasta,
      filas,
    };
  }

  // =========================
  // 2) CORTES EN DINERO
  // =========================
  async cortesMonto(f: EstadisticasFiltroDto) {
    const { fechaDesde, fechaHasta } = f;
    const tenantId = this.tenantId();

    // Sumatoria por articulo del precioTotal de pedidos confirmados en rango
    const qb = this.pedidoRepo
      .createQueryBuilder('p')
      .select('p.articulo', 'articulo')
      .addSelect(
        'COALESCE(SUM(p."precioTotal"::numeric), 0)::text',
        'totalMonto',
      )
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.confirmado = true')
      .andWhere('p.fechaRemito BETWEEN :fd AND :fh', {
        fd: fechaDesde,
        fh: fechaHasta,
      })
      .groupBy('p.articulo')
      .orderBy('totalMonto', 'DESC');

    const rows = await qb.getRawMany<{
      articulo: string;
      totalMonto: string;
    }>();

    return {
      ok: true,
      fechaDesde,
      fechaHasta,
      cortes: rows, // [{ articulo, totalMonto }]
    };
  }

  // =========================
  // 3) CORTES EN KILOS
  // =========================
  async cortesKg(f: EstadisticasFiltroDto) {
    const { fechaDesde, fechaHasta } = f;
    const tenantId = this.tenantId();

    const qb = this.pedidoRepo
      .createQueryBuilder('p')
      .select('p.articulo', 'articulo')
      .addSelect('COALESCE(SUM(p.kg::numeric), 0)::text', 'totalKg')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.confirmado = true')
      .andWhere('p.fechaRemito BETWEEN :fd AND :fh', {
        fd: fechaDesde,
        fh: fechaHasta,
      })
      .groupBy('p.articulo')
      .orderBy('totalKg', 'DESC');

    const rows = await qb.getRawMany<{ articulo: string; totalKg: string }>();

    return {
      ok: true,
      fechaDesde,
      fechaHasta,
      cortes: rows, // [{ articulo, totalKg }]
    };
  }

  // =========================
  // 4) MEJOR CLIENTE (QUE MÁS PAGA) POR MES
  // =========================
  async mejorClientePorMes(f: EstadisticasFiltroDto) {
    const { fechaDesde, fechaHasta } = f;
    const tenantId = this.tenantId();

    // Sumar cobros por cliente y mes (YYYY-MM)
    const qb = this.movRepo
      .createQueryBuilder('m')
      .select(`to_char(m.fecha::date, 'YYYY-MM')`, 'mes')
      .addSelect('m.clienteId', 'clienteId')
      .addSelect('COALESCE(SUM(m.monto::numeric), 0)::text', 'totalCobrado')
      .where('m.tenantId = :tenantId', { tenantId })
      .andWhere('m.tipo = :cobro', { cobro: 'COBRO' })
      .andWhere('m.fecha BETWEEN :fd AND :fh', {
        fd: fechaDesde,
        fh: fechaHasta,
      })
      .groupBy('mes')
      .addGroupBy('m.clienteId')
      .orderBy('mes', 'ASC')
      .addOrderBy('totalCobrado', 'DESC');

    const rows = await qb.getRawMany<{
      mes: string;
      clienteId: string;
      totalCobrado: string;
    }>();

    // Elegimos top por mes
    const porMes = new Map<
      string,
      { mes: string; cliente: Cliente; totalCobrado: string }
    >();
    for (const r of rows) {
      if (!porMes.has(r.mes)) {
        const cliente = await this.clienteRepo.findOne({
          where: { tenantId, id: r.clienteId },
        });
        if (cliente) {
          porMes.set(r.mes, {
            mes: r.mes,
            cliente,
            totalCobrado: Number(r.totalCobrado).toFixed(2),
          });
        }
      }
    }

    // Top global del período (suma de cobros por cliente en el rango)
    const topGlobalQb = this.movRepo
      .createQueryBuilder('m')
      .select('m.clienteId', 'clienteId')
      .addSelect('COALESCE(SUM(m.monto::numeric), 0)::text', 'totalCobrado')
      .where('m.tenantId = :tenantId', { tenantId })
      .andWhere('m.tipo = :cobro', { cobro: 'COBRO' })
      .andWhere('m.fecha BETWEEN :fd AND :fh', {
        fd: fechaDesde,
        fh: fechaHasta,
      })
      .groupBy('m.clienteId')
      .orderBy('totalCobrado', 'DESC')
      .limit(1);

    const topGlobalRow = await topGlobalQb.getRawOne<{
      clienteId: string;
      totalCobrado: string;
    }>();
    let topGlobal: { cliente: Cliente; totalCobrado: string } | null = null;

    if (topGlobalRow?.clienteId) {
      const cliente = await this.clienteRepo.findOne({
        where: { tenantId, id: topGlobalRow.clienteId },
      });
      if (cliente) {
        topGlobal = {
          cliente,
          totalCobrado: Number(topGlobalRow.totalCobrado).toFixed(2),
        };
      }
    }

    return {
      ok: true,
      fechaDesde,
      fechaHasta,
      porMes: Array.from(porMes.values()), // [{ mes, cliente, totalCobrado }]
      topGlobal, // mejor cliente del período completo
    };
  }

  // =========================
  // 5) RESUMEN (AGRUPA TODO)
  // =========================
  async resumen(f: EstadisticasFiltroDto) {
    const [deuda, dinero, kilos, mejor] = await Promise.all([
      this.deudaPorCliente(f),
      this.cortesMonto(f),
      this.cortesKg(f),
      this.mejorClientePorMes(f),
    ]);

    return {
      ok: true,
      fechaDesde: f.fechaDesde,
      fechaHasta: f.fechaHasta,
      deudaPorCliente: deuda.filas,
      cortesMonto: dinero.cortes,
      cortesKg: kilos.cortes,
      mejorClientePorMes: mejor.porMes,
      mejorClienteTopGlobal: mejor.topGlobal,
    };
  }
}
