"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuentaCorrienteService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const request_context_1 = require("../../common/request-context");
const movimiento_entity_1 = require("../movimientos/movimiento.entity");
const cliente_entity_1 = require("../clientes/cliente.entity");
const remito_venta_entity_1 = require("../remitos/entities/remito-venta.entity");
const cobro_aplicacion_entity_1 = require("../cobros/entities/cobro-aplicacion.entity");
const cobro_entity_1 = require("../cobros/entities/cobro.entity");
let CuentaCorrienteService = class CuentaCorrienteService {
    constructor(movs, clientes, remitos, apps, cobros) {
        this.movs = movs;
        this.clientes = clientes;
        this.remitos = remitos;
        this.apps = apps;
        this.cobros = cobros;
    }
    /** Totales DEBE/HABER y saldo de un cliente */
    async saldoCliente(clienteId) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const exists = await this.clientes.findOne({ where: { id: clienteId, tenant_id: tenantId } });
        if (!exists)
            throw new common_1.NotFoundException('Cliente no encontrado');
        const { debe, haber } = await this.movs.createQueryBuilder('m')
            .select('COALESCE(SUM(CASE WHEN m.tipo = \'DEBE\' THEN m.monto::numeric ELSE 0 END),0)', 'debe')
            .addSelect('COALESCE(SUM(CASE WHEN m.tipo = \'HABER\' THEN m.monto::numeric ELSE 0 END),0)', 'haber')
            .where('m.tenant_id = :tenantId AND m.clienteId = :clienteId', { tenantId, clienteId })
            .getRawOne() ?? { debe: '0', haber: '0' };
        const saldo = Number(debe) - Number(haber);
        return {
            cliente: { id: exists.id, nombre: exists.nombre, cuit: exists.cuit },
            debe: Number(debe).toFixed(2),
            haber: Number(haber).toFixed(2),
            saldo: saldo.toFixed(2),
        };
    }
    /** Listado de saldos por cliente (paginado + filtros) */
    async saldos(q) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const qb = this.clientes.createQueryBuilder('c')
            .select(['c.id AS id', 'c.nombre AS nombre', 'c.cuit AS cuit'])
            .addSelect('COALESCE(SUM(CASE WHEN m.tipo = \'DEBE\' THEN m.monto::numeric ELSE 0 END),0)', 'debe')
            .addSelect('COALESCE(SUM(CASE WHEN m.tipo = \'HABER\' THEN m.monto::numeric ELSE 0 END),0)', 'haber')
            .leftJoin(movimiento_entity_1.MovimientoCC, 'm', 'm.tenant_id = c.tenant_id AND m.clienteId = c.id')
            .where('c.tenant_id = :tenantId', { tenantId });
        if (q.q)
            qb.andWhere('(c.nombre ILIKE :q OR c.cuit ILIKE :q OR c.email ILIKE :q)', { q: `%${q.q}%` });
        qb.groupBy('c.id');
        let orderExpr = q.orderBy === 'saldo'
            ? '(COALESCE(SUM(CASE WHEN m.tipo = \'DEBE\' THEN m.monto::numeric ELSE 0 END),0) - COALESCE(SUM(CASE WHEN m.tipo = \'HABER\' THEN m.monto::numeric ELSE 0 END),0))'
            : `c.${q.orderBy ?? 'nombre'}`;
        qb.orderBy(orderExpr, (q.order ?? 'ASC'));
        const page = q.page ?? 1, limit = q.limit ?? 20;
        qb.offset((page - 1) * limit).limit(limit);
        const rows = await qb.getRawMany();
        const items = rows.map(r => ({
            id: Number(r.id),
            nombre: r.nombre,
            cuit: r.cuit,
            debe: Number(r.debe).toFixed(2),
            haber: Number(r.haber).toFixed(2),
            saldo: (Number(r.debe) - Number(r.haber)).toFixed(2),
        }));
        if (q.filtro === 'conSaldo')
            return { items: items.filter(i => Number(i.saldo) !== 0), page, limit };
        if (q.filtro === 'sinSaldo')
            return { items: items.filter(i => Number(i.saldo) === 0), page, limit };
        return { items, page, limit };
    }
    /** Extracto de movimientos con saldo acumulado */
    async extracto(clienteId, q) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const exists = await this.clientes.findOne({ where: { id: clienteId, tenant_id: tenantId } });
        if (!exists)
            throw new common_1.NotFoundException('Cliente no encontrado');
        const where = ['m.tenant_id = :tenantId', 'm.clienteId = :clienteId'];
        const params = { tenantId, clienteId };
        if (q.desde) {
            where.push('m.fecha >= :desde');
            params.desde = q.desde;
        }
        if (q.hasta) {
            where.push('m.fecha <= :hasta');
            params.hasta = q.hasta;
        }
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
            .getRawMany();
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
    async remitosAbiertos(clienteId) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const exists = await this.clientes.findOne({ where: { id: clienteId, tenant_id: tenantId } });
        if (!exists)
            throw new common_1.NotFoundException('Cliente no encontrado');
        const qb = this.remitos.createQueryBuilder('r')
            .select([
            'r.id AS id',
            'r.fecha AS fecha',
            'r.numero AS numero',
            'r.total::numeric AS total',
            'COALESCE(SUM(a.monto::numeric),0) AS aplicado',
        ])
            .leftJoin(cobro_aplicacion_entity_1.CobroAplicacion, 'a', 'a.remitoId = r.id')
            .leftJoin(cobro_entity_1.Cobro, 'c', 'c.id = a.cobroId AND c.deleted_at IS NULL AND c.estado = \'CONFIRMADO\' AND c.tenant_id = r.tenant_id')
            .where('r.tenant_id = :tenantId AND r.clienteId = :clienteId AND r.deleted_at IS NULL', { tenantId, clienteId })
            .groupBy('r.id')
            .orderBy('r.fecha', 'ASC')
            .addOrderBy('r.numero', 'ASC');
        const rows = await qb.getRawMany();
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
};
exports.CuentaCorrienteService = CuentaCorrienteService;
exports.CuentaCorrienteService = CuentaCorrienteService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(movimiento_entity_1.MovimientoCC)),
    __param(1, (0, typeorm_1.InjectRepository)(cliente_entity_1.Cliente)),
    __param(2, (0, typeorm_1.InjectRepository)(remito_venta_entity_1.RemitoVenta)),
    __param(3, (0, typeorm_1.InjectRepository)(cobro_aplicacion_entity_1.CobroAplicacion)),
    __param(4, (0, typeorm_1.InjectRepository)(cobro_entity_1.Cobro)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], CuentaCorrienteService);
//# sourceMappingURL=cuenta-corriente.service.js.map