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
exports.PreciosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const request_context_1 = require("../../common/request-context");
const precio_producto_entity_1 = require("./precio-producto.entity");
const lista_precio_entity_1 = require("./lista-precio.entity");
const producto_entity_1 = require("../productos/producto.entity");
let PreciosService = class PreciosService {
    constructor(repo, listas, productos) {
        this.repo = repo;
        this.listas = listas;
        this.productos = productos;
    }
    async ensureLista(tenantId, listaId) {
        const l = await this.listas.findOne({ where: { id: listaId, tenant_id: tenantId } });
        if (!l)
            throw new common_1.NotFoundException('Lista de precios no encontrada');
        return l;
    }
    async ensureProducto(tenantId, productoId) {
        const p = await this.productos.findOne({ where: { id: productoId, tenant_id: tenantId } });
        if (!p)
            throw new common_1.NotFoundException('Producto no encontrado');
        return p;
    }
    // Chequea solapamientos de vigencia para la misma lista+producto
    async checkOverlap(tenantId, listaId, productoId, desde, hasta, excludeId) {
        const qb = this.repo.createQueryBuilder('pp')
            .where('pp.tenant_id = :tenantId', { tenantId })
            .andWhere('pp.listaId = :listaId', { listaId })
            .andWhere('pp.productoId = :productoId', { productoId })
            .andWhere('pp.deleted_at IS NULL');
        if (excludeId)
            qb.andWhere('pp.id != :id', { id: excludeId });
        // Condición de solapamiento SIN pasar parámetros nulos:
        // Solapa si: (COALESCE(pp.hasta, ∞) >= desde) AND (pp.desde <= COALESCE(hasta, ∞))
        qb.andWhere(`COALESCE(pp.vigenciaHasta, DATE '9999-12-31') >= :desde::date`, { desde });
        const upper = hasta ?? '9999-12-31';
        qb.andWhere(`pp.vigenciaDesde <= :upper::date`, { upper });
        const exists = await qb.getCount();
        if (exists > 0) {
            throw new common_1.ConflictException('Ya existe un precio vigente que se solapa para este producto en esa lista');
        }
    }
    async create(listaId, dto) {
        const tenantId = request_context_1.RequestContext.tenantId();
        await this.ensureLista(tenantId, listaId);
        await this.ensureProducto(tenantId, dto.productoId);
        if (dto.vigenciaHasta && dto.vigenciaHasta < dto.vigenciaDesde) {
            throw new common_1.ConflictException('vigenciaHasta no puede ser menor que vigenciaDesde');
        }
        await this.checkOverlap(tenantId, listaId, dto.productoId, dto.vigenciaDesde, dto.vigenciaHasta ?? null);
        const entity = this.repo.create({ ...dto, listaId, tenant_id: tenantId });
        return this.repo.save(entity);
    }
    async findAll(listaId, q) {
        const tenantId = request_context_1.RequestContext.tenantId();
        await this.ensureLista(tenantId, listaId);
        const qb = this.repo.createQueryBuilder('pp')
            .leftJoinAndSelect('pp.producto', 'p')
            .where('pp.tenant_id = :tenantId', { tenantId })
            .andWhere('pp.listaId = :listaId', { listaId });
        if (q.productoId)
            qb.andWhere('pp.productoId = :productoId', { productoId: q.productoId });
        if (q.vigenciaEn) {
            qb.andWhere('pp.vigenciaDesde <= :fecha', { fecha: q.vigenciaEn })
                .andWhere('(pp.vigenciaHasta IS NULL OR pp.vigenciaHasta >= :fecha)', { fecha: q.vigenciaEn });
        }
        qb.orderBy(`pp.${q.orderBy ?? 'vigenciaDesde'}`, (q.order ?? 'DESC'));
        const page = q.page ?? 1, limit = q.limit ?? 20;
        qb.skip((page - 1) * limit).take(limit);
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }
    async findOne(listaId, id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        await this.ensureLista(tenantId, listaId);
        const entity = await this.repo.findOne({ where: { id, tenant_id: tenantId, listaId } });
        if (!entity)
            throw new common_1.NotFoundException('Precio no encontrado');
        return entity;
    }
    async update(listaId, id, dto) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const entity = await this.findOne(listaId, id);
        const vigDesde = dto.vigenciaDesde ?? entity.vigenciaDesde;
        const vigHasta = dto.vigenciaHasta ?? entity.vigenciaHasta ?? null;
        if (vigHasta && vigHasta < vigDesde) {
            throw new common_1.ConflictException('vigenciaHasta no puede ser menor que vigenciaDesde');
        }
        await this.checkOverlap(tenantId, listaId, entity.productoId, vigDesde, vigHasta, id);
        Object.assign(entity, dto);
        return this.repo.save(entity);
    }
    async remove(listaId, id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const res = await this.repo.softDelete({ id, tenant_id: tenantId, listaId });
        if (!res.affected)
            throw new common_1.NotFoundException('Precio no encontrado');
        return { ok: true };
    }
};
exports.PreciosService = PreciosService;
exports.PreciosService = PreciosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(precio_producto_entity_1.PrecioProducto)),
    __param(1, (0, typeorm_1.InjectRepository)(lista_precio_entity_1.ListaPrecio)),
    __param(2, (0, typeorm_1.InjectRepository)(producto_entity_1.Producto)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PreciosService);
//# sourceMappingURL=precios.service.js.map