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
exports.MovimientosService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const movimiento_entity_1 = require("./movimiento.entity");
const request_context_1 = require("../../common/request-context");
let MovimientosService = class MovimientosService {
    constructor(repo) {
        this.repo = repo;
    }
    async crear(params) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const mov = this.repo.create({ ...params, tenant_id: tenantId });
        return this.repo.save(mov);
    }
    async revertirDe(origen, referenciaId, observaciones) {
        const tenantId = request_context_1.RequestContext.tenantId();
        const mov = await this.repo.findOne({ where: { tenant_id: tenantId, origen, referenciaId } });
        if (!mov)
            return null;
        // Contra-asiento
        const tipo = mov.tipo === 'DEBE' ? 'HABER' : 'DEBE';
        const rev = this.repo.create({
            tenant_id: tenantId,
            clienteId: mov.clienteId,
            fecha: mov.fecha,
            tipo,
            origen,
            referenciaId,
            monto: mov.monto,
            observaciones: observaciones ?? 'Reverso automático',
        });
        return this.repo.save(rev);
    }
};
exports.MovimientosService = MovimientosService;
exports.MovimientosService = MovimientosService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(movimiento_entity_1.MovimientoCC)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MovimientosService);
//# sourceMappingURL=movimientos.service.js.map