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
exports.CobroAplicacion = void 0;
const typeorm_1 = require("typeorm");
const base_tenant_entity_1 = require("../../../common/entities/base-tenant.entity");
const cobro_entity_1 = require("./cobro.entity");
const remito_venta_entity_1 = require("../../remitos/entities/remito-venta.entity");
let CobroAplicacion = class CobroAplicacion extends base_tenant_entity_1.BaseTenantEntity {
};
exports.CobroAplicacion = CobroAplicacion;
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], CobroAplicacion.prototype, "cobroId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cobro_entity_1.Cobro, (c) => c.aplicaciones, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'cobroId' }),
    __metadata("design:type", cobro_entity_1.Cobro)
], CobroAplicacion.prototype, "cobro", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], CobroAplicacion.prototype, "remitoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => remito_venta_entity_1.RemitoVenta, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'remitoId' }),
    __metadata("design:type", remito_venta_entity_1.RemitoVenta)
], CobroAplicacion.prototype, "remito", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], CobroAplicacion.prototype, "monto", void 0);
exports.CobroAplicacion = CobroAplicacion = __decorate([
    (0, typeorm_1.Entity)('cobro_aplicacion')
], CobroAplicacion);
//# sourceMappingURL=cobro-aplicacion.entity.js.map