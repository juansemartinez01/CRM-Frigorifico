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
exports.ListasPrecioService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const request_context_1 = require("../../common/request-context");
const lista_precio_entity_1 = require("./lista-precio.entity");
const cliente_entity_1 = require("../clientes/cliente.entity");
let ListasPrecioService = class ListasPrecioService {
    constructor(repo, clientes) {
        this.repo = repo;
        this.clientes = clientes;
    }
    async ensureCliente(tenantId, clienteId) {
        if (!clienteId)
            return;
        const c = await this.clientes.findOne({ where: { id: clienteId, tenant_id: tenantId } });
        if (!c)
            throw new common_1.NotFoundException('Cliente no encontrado para esta lista');
    }
    async create(dto) {
        const tenantId = request_context_1.RequestContext.tenantId();
        if (dto.tipo === 'CLIENTE') {
            await this.ensureCliente(tenantId, dto.clienteId);
        }
        else {
            dto.clienteId = undefined;
        }
        const exists = await this.repo.findOne({ where: { tenant_id: tenantId, nombre: dto.nombre } });
        if (exists)
            throw new common_1.ConflictException('Ya existe una lista con ese nombre');
        const entity = this.repo.create({ ...dto, tenant_id: tenantId });
        return this.repo.save(entity);
    }
    async findAll(q) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const qb = this.repo.createQueryBuilder('l').where('l.tenant_id = :tenantId', { tenantId });
        if (q.q)
            qb.andWhere('(l.nombre ILIKE :q OR l.moneda ILIKE :q OR l.notas ILIKE :q)', { q: `%${q.q}%` });
        if (q.tipo)
            qb.andWhere('l.tipo = :tipo', { tipo: q.tipo });
        if (q.clienteId)
            qb.andWhere('l.clienteId = :clienteId', { clienteId: q.clienteId });
        if (q.activo === 'true')
            qb.andWhere('l.activo = true');
        if (q.activo === 'false')
            qb.andWhere('l.activo = false');
        qb.orderBy(`l.${q.orderBy ?? 'nombre'}`, (q.order ?? 'ASC'));
        const page = q.page ?? 1, limit = q.limit ?? 20;
        qb.skip((page - 1) * limit).take(limit);
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }
    async findOne(id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const entity = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
        if (!entity)
            throw new common_1.NotFoundException('Lista no encontrada');
        return entity;
    }
    async update(id, dto) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const entity = await this.findOne(id);
        if (dto.tipo === 'CLIENTE') {
            await this.ensureCliente(tenantId, dto.clienteId ?? entity.clienteId);
        }
        if (dto.nombre && dto.nombre !== entity.nombre) {
            const coll = await this.repo.findOne({ where: { tenant_id: tenantId, nombre: dto.nombre } });
            if (coll)
                throw new common_1.ConflictException('Nombre de lista ya usado');
        }
        Object.assign(entity, dto);
        return this.repo.save(entity);
    }
    async remove(id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const res = await this.repo.softDelete({ id, tenant_id: tenantId });
        if (!res.affected)
            throw new common_1.NotFoundException('Lista no encontrada');
        return { ok: true };
    }
};
exports.ListasPrecioService = ListasPrecioService;
exports.ListasPrecioService = ListasPrecioService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(lista_precio_entity_1.ListaPrecio)),
    __param(1, (0, typeorm_1.InjectRepository)(cliente_entity_1.Cliente)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ListasPrecioService);
//# sourceMappingURL=listas-precio.service.js.map