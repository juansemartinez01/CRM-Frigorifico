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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovimientoCC = void 0;
// src/modules/movimientos/movimiento-cc.entity.ts
const typeorm_1 = require("typeorm");
const base_tenant_entity_1 = require("../../common/entities/base-tenant.entity");
let MovimientoCC = class MovimientoCC extends base_tenant_entity_1.BaseTenantEntity {
};
exports.MovimientoCC = MovimientoCC;
__decorate([
    (0, typeorm_1.Column)({ name: 'clienteId', type: 'int' }),
    __metadata("design:type", Number)
], MovimientoCC.prototype, "clienteId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], MovimientoCC.prototype, "fecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 8 }),
    __metadata("design:type", String)
], MovimientoCC.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 12 }),
    __metadata("design:type", String)
], MovimientoCC.prototype, "origen", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], MovimientoCC.prototype, "monto", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'referenciaId', type: 'int', nullable: true }),
    __metadata("design:type", Object)
], MovimientoCC.prototype, "referenciaId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], MovimientoCC.prototype, "observaciones", void 0);
exports.MovimientoCC = MovimientoCC = __decorate([
    (0, typeorm_1.Entity)('mov_cc_cliente'),
    (0, typeorm_1.Index)(['tenant_id', 'clienteId', 'fecha']),
    (0, typeorm_1.Index)(['tenant_id', 'origen', 'referenciaId']) // acelera los joins por referencia
], MovimientoCC);
//# sourceMappingURL=movimiento.entity.js.map