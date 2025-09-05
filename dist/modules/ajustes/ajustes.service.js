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
exports.AjustesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const request_context_1 = require("../../common/request-context");
const ajuste_cc_entity_1 = require("./entities/ajuste-cc.entity");
const cliente_entity_1 = require("../clientes/cliente.entity");
const movimientos_service_1 = require("../movimientos/movimientos.service");
function toMoney(n) { return n.toFixed(2); }
let AjustesService = class AjustesService {
    constructor(repo, clientes, dataSource, movs) {
        this.repo = repo;
        this.clientes = clientes;
        this.dataSource = dataSource;
        this.movs = movs;
    }
    async ensureCliente(tenantId, id) {
        const c = await this.clientes.findOne({ where: { id, tenant_id: tenantId } });
        if (!c)
            throw new common_1.NotFoundException('Cliente no encontrado');
    }
    async nextNumeroLocked(manager, tenantId) {
        // lock transaccional por tenant para "AJUSTE" (namespace 1002)
        await manager.query('SELECT pg_advisory_xact_lock($1, $2)', [1002, tenantId]);
        const { max } = await manager.getRepository(ajuste_cc_entity_1.AjusteCC)
            .createQueryBuilder('a').withDeleted()
            .select('COALESCE(MAX(a.numero), 0)', 'max')
            .where('a.tenant_id = :tenantId', { tenantId })
            .getRawOne() ?? { max: '0' };
        return Number(max) + 1;
    }
    async create(dto) {
        const tenantId = request_context_1.RequestContext.tenantId();
        await this.ensureCliente(tenantId, dto.clienteId);
        const saved = await this.dataSource.transaction(async (manager) => {
            const numero = await this.nextNumeroLocked(manager, tenantId);
            const montoNum = Number(dto.monto);
            if (!isFinite(montoNum) || montoNum <= 0)
                throw new common_1.BadRequestException('monto inválido');
            const e = manager.getRepository(ajuste_cc_entity_1.AjusteCC).create({
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
            return manager.getRepository(ajuste_cc_entity_1.AjusteCC).save(e);
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
    async findAll(q) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const qb = this.repo.createQueryBuilder('a').where('a.tenant_id = :tenantId', { tenantId });
        if (q.clienteId)
            qb.andWhere('a.clienteId = :cid', { cid: q.clienteId });
        if (q.tipo)
            qb.andWhere('a.tipo = :t', { t: q.tipo });
        if (q.estado)
            qb.andWhere('a.estado = :e', { e: q.estado });
        if (q.desde)
            qb.andWhere('a.fecha >= :d', { d: q.desde });
        if (q.hasta)
            qb.andWhere('a.fecha <= :h', { h: q.hasta });
        qb.orderBy(`a.${q.orderBy ?? 'fecha'}`, (q.order ?? 'DESC'));
        const page = q.page ?? 1, limit = q.limit ?? 20;
        qb.skip((page - 1) * limit).take(limit);
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }
    async findOne(id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const e = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
        if (!e)
            throw new common_1.NotFoundException('Ajuste no encontrado');
        return e;
    }
    async update(id, dto) {
        const e = await this.findOne(id);
        if (e.estado === 'ANULADO')
            throw new common_1.ConflictException('No se puede modificar un ajuste anulado');
        const nuevo = { ...e };
        if (dto.fecha)
            nuevo.fecha = dto.fecha;
        if (dto.tipo)
            nuevo.tipo = dto.tipo;
        if (dto.motivo)
            nuevo.motivo = dto.motivo;
        if (dto.monto !== undefined) {
            const m = Number(dto.monto);
            if (!isFinite(m) || m <= 0)
                throw new common_1.BadRequestException('monto inválido');
            nuevo.monto = toMoney(m);
        }
        if (dto.observaciones !== undefined)
            nuevo.observaciones = dto.observaciones;
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
    async anular(id) {
        const e = await this.findOne(id);
        if (e.estado === 'ANULADO')
            return e;
        e.estado = 'ANULADO';
        const saved = await this.repo.save(e);
        await this.movs.revertirDe('AJUSTE', saved.id, 'Anulación de ajuste');
        return saved;
    }
    async remove(id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const e = await this.findOne(id);
        await this.repo.softDelete({ id: e.id, tenant_id: tenantId });
        await this.movs.revertirDe('AJUSTE', e.id, 'Baja lógica de ajuste');
        return { ok: true };
    }
};
exports.AjustesService = AjustesService;
exports.AjustesService = AjustesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(ajuste_cc_entity_1.AjusteCC)),
    __param(1, (0, typeorm_2.InjectRepository)(cliente_entity_1.Cliente)),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.DataSource,
        movimientos_service_1.MovimientosService])
], AjustesService);
//# sourceMappingURL=ajustes.service.js.map