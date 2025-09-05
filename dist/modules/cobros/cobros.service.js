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
exports.CobrosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const request_context_1 = require("../../common/request-context");
const cobro_entity_1 = require("./entities/cobro.entity");
const cobro_aplicacion_entity_1 = require("./entities/cobro-aplicacion.entity");
const medio_cobro_entity_1 = require("./entities/medio-cobro.entity");
const cliente_entity_1 = require("../clientes/cliente.entity");
const remito_venta_entity_1 = require("../remitos/entities/remito-venta.entity");
const movimientos_service_1 = require("../movimientos/movimientos.service");
function toMoney(n) { return n.toFixed(2); }
let CobrosService = class CobrosService {
    constructor(cobros, apps, medios, clientes, remitos, movs, dataSource) {
        this.cobros = cobros;
        this.apps = apps;
        this.medios = medios;
        this.clientes = clientes;
        this.remitos = remitos;
        this.movs = movs;
        this.dataSource = dataSource;
    }
    async nextNumero(tenantId) {
        const { max } = await this.cobros
            .createQueryBuilder('c')
            .select('COALESCE(MAX(c.numero), 0)', 'max')
            .where('c.tenant_id = :tenantId', { tenantId })
            .getRawOne() ?? { max: '0' };
        return Number(max) + 1;
    }
    async nextNumeroLocked(m, tenantId) {
        await m.query('SELECT pg_advisory_xact_lock($1, $2)', [1003, tenantId]); // namespace para COBRO
        const { max } = await m.getRepository(cobro_entity_1.Cobro)
            .createQueryBuilder('c').withDeleted()
            .select('COALESCE(MAX(c.numero), 0)', 'max')
            .where('c.tenant_id = :tenantId', { tenantId })
            .getRawOne() ?? { max: '0' };
        return Number(max) + 1;
    }
    async ensureCliente(tenantId, id) {
        const c = await this.clientes.findOne({ where: { id, tenant_id: tenantId } });
        if (!c)
            throw new common_1.NotFoundException('Cliente no encontrado');
    }
    async ensureMedio(tenantId, id) {
        const m = await this.medios.findOne({ where: { id, tenant_id: tenantId } });
        if (!m)
            throw new common_1.NotFoundException('Medio de cobro no encontrado');
    }
    async ensureRemito(tenantId, id) {
        const r = await this.remitos.findOne({ where: { id, tenant_id: tenantId } });
        if (!r)
            throw new common_1.NotFoundException('Remito no encontrado');
        return r;
    }
    async saldoRemito(tenantId, remitoId) {
        const rem = await this.ensureRemito(tenantId, remitoId);
        const total = Number(rem.total);
        const { sum } = await this.apps.createQueryBuilder('a')
            .innerJoin('a.cobro', 'c', 'c.id = a.cobroId AND c.deleted_at IS NULL AND c.tenant_id = :tenantId', { tenantId })
            .select('COALESCE(SUM(a.monto::numeric), 0)', 'sum')
            .where('a.remitoId = :remitoId', { remitoId })
            .getRawOne() ?? { sum: '0' };
        const aplicado = Number(sum || 0);
        return total - aplicado;
    }
    validarAplicacionesDelCliente(remitos, clienteId) {
        for (const r of remitos)
            if (r.clienteId !== clienteId) {
                throw new common_1.ConflictException(`El remito ${r.id} pertenece a otro cliente`);
            }
    }
    async create(dto) {
        const tenantId = request_context_1.RequestContext.tenantId();
        await this.ensureCliente(tenantId, dto.clienteId);
        await this.ensureMedio(tenantId, dto.medioId);
        return await this.dataSource.transaction(async (m) => {
            const numero = await this.nextNumeroLocked(m, tenantId);
            const montoNum = Number(dto.monto);
            if (!isFinite(montoNum) || montoNum <= 0)
                throw new common_1.BadRequestException('monto inválido');
            // Validaciones de aplicaciones
            const remitosIds = Array.from(new Set((dto.aplicaciones ?? []).map(a => Number(a.remitoId)))).filter(Boolean);
            const remitos = remitosIds.length
                ? await this.remitos.find({ where: { tenant_id: tenantId, id: (0, typeorm_2.In)(remitosIds) } })
                : [];
            if (remitosIds.length && remitos.length !== remitosIds.length) {
                throw new common_1.NotFoundException('Algún remito no existe en este tenant');
            }
            if (remitos.length)
                this.validarAplicacionesDelCliente(remitos, dto.clienteId);
            let sumApps = 0;
            for (const a of dto.aplicaciones ?? []) {
                const saldo = await this.saldoRemito(tenantId, a.remitoId);
                const aNum = Number(a.monto);
                if (!isFinite(aNum) || aNum <= 0)
                    throw new common_1.BadRequestException('Monto de imputación inválido');
                if (aNum > saldo + 0.0001)
                    throw new common_1.ConflictException(`Imputación excede saldo del remito ${a.remitoId}`);
                sumApps += aNum;
            }
            if (sumApps - montoNum > 0.0001) {
                throw new common_1.ConflictException('La suma de imputaciones supera el monto del cobro');
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
            const saved = await m.getRepository(cobro_entity_1.Cobro).save(cobro);
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
    async findAll(q) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const qb = this.cobros.createQueryBuilder('c')
            .leftJoinAndSelect('c.aplicaciones', 'a')
            .leftJoinAndSelect('c.medio', 'm')
            .leftJoinAndSelect('c.cliente', 'cli')
            .where('c.tenant_id = :tenantId', { tenantId });
        if (q.clienteId)
            qb.andWhere('c.clienteId = :cid', { cid: q.clienteId });
        if (q.medioId)
            qb.andWhere('c.medioId = :mid', { mid: q.medioId });
        if (q.numeroLike)
            qb.andWhere('CAST(c.numero AS TEXT) ILIKE :n', { n: `%${q.numeroLike}%` });
        if (q.desde)
            qb.andWhere('c.fecha >= :d', { d: q.desde });
        if (q.hasta)
            qb.andWhere('c.fecha <= :h', { h: q.hasta });
        qb.orderBy(`c.${q.orderBy ?? 'fecha'}`, (q.order ?? 'DESC'));
        const page = q.page ?? 1, limit = q.limit ?? 20;
        qb.skip((page - 1) * limit).take(limit);
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }
    async findOne(id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const c = await this.cobros.findOne({ where: { id, tenant_id: tenantId }, relations: ['aplicaciones', 'medio', 'cliente'] });
        if (!c)
            throw new common_1.NotFoundException('Cobro no encontrado');
        return c;
    }
    async update(id, dto) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const cobro = await this.findOne(id);
        if (dto.medioId)
            await this.ensureMedio(tenantId, dto.medioId);
        // Validaciones de aplicaciones (si reemplaza)
        if (dto.aplicaciones) {
            // validar cliente y saldos
            const ids = Array.from(new Set(dto.aplicaciones.map(a => Number(a.remitoId)))).filter(Boolean);
            const rems = ids.length ? await this.remitos.find({ where: { tenant_id: tenantId, id: (0, typeorm_2.In)(ids) } }) : [];
            if (ids.length && rems.length !== ids.length)
                throw new common_1.NotFoundException('Algún remito no existe');
            if (rems.length)
                this.validarAplicacionesDelCliente(rems, cobro.clienteId);
            const montoNum = Number(dto.monto ?? cobro.monto);
            let sumApps = 0;
            for (const a of dto.aplicaciones) {
                // saldo disponible debe considerar que este cobro ya había aplicado antes.
                const saldoActual = await this.saldoRemito(tenantId, a.remitoId);
                // recupera lo aplicado por ESTE cobro a ese remito (para permitir reimputar mismo monto)
                const aplicadoPorEste = Number(cobro.aplicaciones.find(x => x.remitoId === a.remitoId)?.monto ?? '0');
                const saldoDisponible = saldoActual + aplicadoPorEste;
                const aNum = Number(a.monto);
                if (!isFinite(aNum) || aNum <= 0)
                    throw new common_1.BadRequestException('Monto de imputación inválido');
                if (aNum > saldoDisponible + 0.0001)
                    throw new common_1.ConflictException(`Imputación excede saldo del remito ${a.remitoId}`);
                sumApps += aNum;
            }
            if (sumApps - montoNum > 0.0001)
                throw new common_1.ConflictException('La suma de imputaciones supera el monto del cobro');
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
    async remove(id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const c = await this.findOne(id);
        await this.cobros.softDelete({ id: c.id, tenant_id: tenantId });
        // Contra-asiento DEBE para anular crédito
        await this.movs.revertirDe('COBRO', c.id, 'Reverso por anulación de cobro');
        return { ok: true };
    }
};
exports.CobrosService = CobrosService;
exports.CobrosService = CobrosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cobro_entity_1.Cobro)),
    __param(1, (0, typeorm_1.InjectRepository)(cobro_aplicacion_entity_1.CobroAplicacion)),
    __param(2, (0, typeorm_1.InjectRepository)(medio_cobro_entity_1.MedioCobro)),
    __param(3, (0, typeorm_1.InjectRepository)(cliente_entity_1.Cliente)),
    __param(4, (0, typeorm_1.InjectRepository)(remito_venta_entity_1.RemitoVenta)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        movimientos_service_1.MovimientosService,
        typeorm_2.DataSource])
], CobrosService);
//# sourceMappingURL=cobros.service.js.map