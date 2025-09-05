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
exports.MediosCobroService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const medio_cobro_entity_1 = require("./entities/medio-cobro.entity");
const request_context_1 = require("../../common/request-context");
let MediosCobroService = class MediosCobroService {
    constructor(repo) {
        this.repo = repo;
    }
    async create(dto) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const exists = await this.repo.findOne({ where: { tenant_id: tenantId, nombre: dto.nombre } });
        if (exists)
            throw new common_1.ConflictException('Ya existe un medio con ese nombre');
        // Convert 'tipo' string to the expected TipoMedio type if necessary
        const entity = this.repo.create({
            ...dto,
            tenant_id: tenantId,
            tipo: dto.tipo ? dto.tipo : undefined // Cast or map as needed
        });
        return this.repo.save(entity);
    }
    async list(q) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const qb = this.repo.createQueryBuilder('m').where('m.tenant_id = :tenantId', { tenantId });
        if (q?.q)
            qb.andWhere('(m.nombre ILIKE :q OR m.tipo ILIKE :q)', { q: `%${q.q}%` });
        if (q?.activo === 'true')
            qb.andWhere('m.activo = true');
        if (q?.activo === 'false')
            qb.andWhere('m.activo = false');
        return qb.orderBy('m.nombre', 'ASC').getMany();
    }
    async findOne(id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const e = await this.repo.findOne({ where: { id, tenant_id: tenantId } });
        if (!e)
            throw new common_1.NotFoundException('Medio no encontrado');
        return e;
    }
    async update(id, dto) {
        const e = await this.findOne(id);
        Object.assign(e, dto);
        return this.repo.save(e);
    }
    async remove(id) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const res = await this.repo.softDelete({ id, tenant_id: tenantId });
        if (!res.affected)
            throw new common_1.NotFoundException('Medio no encontrado');
        return { ok: true };
    }
};
exports.MediosCobroService = MediosCobroService;
exports.MediosCobroService = MediosCobroService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(medio_cobro_entity_1.MedioCobro)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MediosCobroService);
//# sourceMappingURL=medios-cobro.service.js.map