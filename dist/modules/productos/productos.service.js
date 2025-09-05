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
exports.ProductosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const request_context_1 = require("../../common/request-context");
const producto_entity_1 = require("./producto.entity");
const unidad_entity_1 = require("../unidades/unidad.entity");
function isPgUnique(e) {
    return e instanceof typeorm_2.QueryFailedError && String(e.driverError?.code) === '23505';
}
let ProductosService = class ProductosService {
    constructor(repo, unidades) {
        this.repo = repo;
        this.unidades = unidades;
    }
    async ensureUnidad(tenantId, unidadId) {
        const u = await this.unidades.findOne({ where: { id: unidadId, tenant_id: tenantId } });
        if (!u)
            throw new common_1.NotFoundException('Unidad no encontrada en este tenant');
        return u;
    }
    async create(dto) {
        try {
            const entity = this.repo.create(dto);
            return await this.repo.save(entity);
        }
        catch (e) {
            if (isPgUnique(e))
                throw new common_1.ConflictException('Producto duplicado (nombre+unidad o SKU)');
            throw e;
        }
    }
    async findAll(q) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const qb = this.repo.createQueryBuilder('p')
            .leftJoinAndSelect('p.unidad', 'u')
            .where('p.tenant_id = :tenantId', { tenantId });
        if (q.q)
            qb.andWhere('(p.nombre ILIKE :q OR p.sku ILIKE :q OR p.descripcion ILIKE :q)', { q: `%${q.q}%` });
        if (q.unidadId)
            qb.andWhere('p.unidadId = :unidadId', { unidadId: q.unidadId });
        qb.orderBy(`p.${q.orderBy ?? 'nombre'}`, (q.order ?? 'ASC'));
        const page = q.page ?? 1, limit = q.limit ?? 20;
        qb.skip((page - 1) * limit).take(limit);
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }
    async findOne(id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const entity = await this.repo.findOne({ where: { id, tenant_id: tenantId }, relations: ['unidad'] });
        if (!entity)
            throw new common_1.NotFoundException('Producto no encontrado');
        return entity;
    }
    async update(id, dto) {
        const entity = await this.repo.findOneBy({ id, tenant_id: request_context_1.RequestContext.tenantId() });
        if (!entity)
            throw new common_1.NotFoundException('Producto no encontrado');
        Object.assign(entity, dto);
        try {
            return await this.repo.save(entity);
        }
        catch (e) {
            if (isPgUnique(e))
                throw new common_1.ConflictException('Producto duplicado (nombre+unidad o SKU)');
            throw e;
        }
    }
    async remove(id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const res = await this.repo.softDelete({ id, tenant_id: tenantId });
        if (!res.affected)
            throw new common_1.NotFoundException('Producto no encontrado');
        return { ok: true };
    }
};
exports.ProductosService = ProductosService;
exports.ProductosService = ProductosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(producto_entity_1.Producto)),
    __param(1, (0, typeorm_1.InjectRepository)(unidad_entity_1.Unidad)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], ProductosService);
//# sourceMappingURL=productos.service.js.map