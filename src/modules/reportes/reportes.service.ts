// src/modules/reportes/reportes.service.ts
import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { RequestContext } from '../../common/request-context';
import { LibroQueryDto } from './dto/libro-query.dto';

@Injectable()
export class ReportesService {
  constructor(private readonly ds: DataSource) {}

  async libro(q: LibroQueryDto) {
    const tenantId = RequestContext.tenantId()!;
    const page  = q.page ?? 1;
    const limit = q.limit ?? 50;
    const offset = (page - 1) * limit;
    const sort = (q.sortFecha ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';

    // builder de parámetros posicionales ($1, $2, ...)
    const params: any[] = [];
    const add = (v: any) => { params.push(v); return `$${params.length}`; };

    const pTenant = add(tenantId); // $1

    // CTE base (VENTAS + COBROS). OJO: columnas CamelCase van entre "comillas".
    const base = `
WITH ventas AS (
  SELECT
    'Venta'::text AS tipo,
    rv.fecha::date AS fecha,
    LPAD(rv.numero::text, 6, '0') AS remito,
    COALESCE(ri.descripcion, p.nombre) AS detalle,
    NULL::text AS usuario,
    COALESCE(rv.observaciones,'') AS observaciones,
    c.nombre AS cliente,
    p.nombre AS producto,
    ri.cantidad::numeric AS kg,
    ri.precio::numeric   AS precio,
    ri.subtotal::numeric AS monto,
    rv."clienteId" AS cliente_id,
    p.id        AS producto_id,
    rv.id       AS remito_id,
    ri.id       AS remito_item_id,
    NULL::int   AS cobro_id
  FROM remito_item ri
  JOIN remito_venta rv ON rv.id = ri."remitoId"  AND rv.tenant_id = ${pTenant}
  JOIN producto p      ON p.id  = ri."productoId"
  JOIN cliente c       ON c.id  = rv."clienteId"
  WHERE ri.tenant_id = ${pTenant}
),
-- (sigue CTE cobros y resto igual)

cobros AS (
  SELECT
    'cobro'::text AS tipo,
    cb.fecha::date AS fecha,
    NULL::text AS remito,
    NULL::text AS detalle,
    NULL::text AS usuario,
    COALESCE(cb.observaciones,'') AS observaciones,
    c.nombre AS cliente,
    NULL::text AS producto,
    NULL::numeric AS kg,
    NULL::numeric AS precio,
    (CASE WHEN mc."tipo" = 'DEBE' THEN mc.monto ELSE (mc.monto * -1) END)::numeric AS monto,
    cb."clienteId" AS cliente_id,
    NULL::int    AS producto_id,
    NULL::int    AS remito_id,
    NULL::int    AS remito_item_id,
    cb.id        AS cobro_id
  FROM cobro cb
  JOIN cliente c ON c.id = cb."clienteId"
  JOIN mov_cc_cliente mc
       ON mc."origen" = 'COBRO'
      AND mc."referenciaId" = cb.id
      AND mc.tenant_id = ${/* pTenant */ '$1'}
  WHERE cb.tenant_id = ${/* pTenant */ '$1'}        -- ⬅️ quitamos COALESCE(cb.anulado, false) = false
),



base AS (
  SELECT * FROM ventas
  UNION ALL
  SELECT * FROM cobros
)
`;

    // Filtros
    const where: string[] = [];
    if (q.tipo && q.tipo !== 'todos') where.push(`tipo = ${add(q.tipo === 'venta' ? 'Venta' : 'cobro')}`);
    if (q.fechaDesde) where.push(`fecha >= ${add(q.fechaDesde)}`);
    if (q.fechaHasta) where.push(`fecha <= ${add(q.fechaHasta)}`);
    if (q.clienteId) where.push(`cliente_id = ${add(q.clienteId)}`);
    if (q.cliente)   where.push(`cliente ILIKE ${add(`%${q.cliente}%`)}`);
    if (q.productoId) where.push(`producto_id = ${add(q.productoId)}`);
    if (q.producto)   where.push(`producto ILIKE ${add(`%${q.producto}%`)}`);
    if (q.remito)       where.push(`remito ILIKE ${add(`%${q.remito}%`)}`);
    if (q.observaciones) where.push(`observaciones ILIKE ${add(`%${q.observaciones}%`)}`);

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // guardo params antes de agregar limit/offset (para totales)
    const paramsForTotals = params.slice();

    const pLimit  = add(limit);
    const pOffset = add(offset);

    // Data paginada
    const sqlData = `
${base}
SELECT
  tipo, fecha, remito, detalle, usuario, observaciones,
  cliente, producto, kg, precio, monto,
  cliente_id, producto_id, remito_id, remito_item_id, cobro_id,
  COUNT(*) OVER() AS total_rows
FROM base
${whereSQL}
ORDER BY fecha ${sort}, remito NULLS LAST, remito_item_id NULLS LAST, cobro_id NULLS LAST
LIMIT ${pLimit} OFFSET ${pOffset}
`;

    const rows = await this.ds.query(sqlData, params);
    const total = rows.length ? Number(rows[0].total_rows) : 0;

    // Totales sin paginar
    const sqlTotals = `
${base}
SELECT
  COALESCE(SUM(CASE WHEN tipo = 'Venta' THEN kg    ELSE 0 END), 0)::numeric(18,3) AS total_kg,
  COALESCE(SUM(CASE WHEN tipo = 'Venta' THEN monto ELSE 0 END), 0)::numeric(18,2) AS total_ventas,
  COALESCE(SUM(CASE WHEN tipo = 'cobro' THEN monto ELSE 0 END), 0)::numeric(18,2) AS total_cobros,
  COALESCE(SUM(monto), 0)::numeric(18,2) AS saldo
FROM base
${whereSQL}
`;
    const [tot] = await this.ds.query(sqlTotals, paramsForTotals);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / (limit || 1)),
      totals: {
        kg:     String(tot?.total_kg ?? '0.000'),
        ventas: String(tot?.total_ventas ?? '0.00'),
        cobros: String(tot?.total_cobros ?? '0.00'), // negativo
        saldo:  String(tot?.saldo ?? '0.00'),
      },
      data: rows.map((r: any) => ({
        tipo: r.tipo,
        fecha: r.fecha,
        remito: r.remito,
        detalle: r.detalle,
        usuario: r.usuario,
        observaciones: r.observaciones,
        cliente: r.cliente,
        producto: r.producto,
        kg: r.kg,
        precio: r.precio,
        monto: r.monto,
        ids: {
          clienteId: r.cliente_id,
          productoId: r.producto_id,
          remitoId: r.remito_id,
          remitoItemId: r.remito_item_id,
          cobroId: r.cobro_id,
        },
      })),
    };
  }
}
