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
exports.ClientesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const cliente_entity_1 = require("./cliente.entity");
const request_context_1 = require("../../common/request-context");
let ClientesService = class ClientesService {
    constructor(repo) {
        this.repo = repo;
    }
    async create(dto) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const entity = this.repo.create({ ...dto, tenant_id: tenantId });
        return this.repo.save(entity);
    }
    async findAll(qry) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const page = qry.page ?? 1;
        const limit = qry.limit ?? 10;
        const where = { tenant_id: tenantId };
        if (qry.q) {
            // Búsqueda simple por varios campos (ILIKE = case-insensitive)
            const like = (0, typeorm_2.ILike)(`%${qry.q}%`);
            where['__or'] = true; // marcador interno para saber que combinamos manualmente
            // construiremos a mano en query builder para OR
        }
        // Query builder para poder hacer OR agrupado
        const qb = this.repo.createQueryBuilder('c')
            .where('c.tenant_id = :tenantId', { tenantId });
        if (qry.q) {
            qb.andWhere('(c.nombre ILIKE :q OR c.email ILIKE :q OR c.cuit ILIKE :q OR c.telefono ILIKE :q)', { q: `%${qry.q}%` });
        }
        if (qry.activo === 'true')
            qb.andWhere('c.activo = true');
        if (qry.activo === 'false')
            qb.andWhere('c.activo = false');
        const orderBy = ['id', 'nombre', 'created_at'].includes(qry.orderBy) ? qry.orderBy : 'id';
        const order = (qry.order === 'ASC' ? 'ASC' : 'DESC');
        qb.orderBy(`c.${orderBy}`, order);
        qb.skip((page - 1) * limit).take(limit);
        const [items, total] = await qb.getManyAndCount();
        return { items, total, page, limit };
    }
    async findOne(id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const entity = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
        if (!entity)
            throw new common_1.NotFoundException('Cliente no encontrado');
        return entity;
    }
    async update(id, dto) {
        const entity = await this.findOne(id);
        Object.assign(entity, dto);
        return this.repo.save(entity);
    }
    async activar(id) {
        const entity = await this.findOne(id);
        entity.activo = true;
        return this.repo.save(entity);
    }
    async desactivar(id) {
        const entity = await this.findOne(id);
        entity.activo = false;
        return this.repo.save(entity);
    }
    async remove(id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        // soft delete
        const res = await this.repo.softDelete({ id, tenant_id: tenantId });
        if (!res.affected)
            throw new common_1.NotFoundException('Cliente no encontrado');
        return { ok: true };
    }
};
exports.ClientesService = ClientesService;
exports.ClientesService = ClientesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(cliente_entity_1.Cliente)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ClientesService);
//# sourceMappingURL=clientes.service.js.map