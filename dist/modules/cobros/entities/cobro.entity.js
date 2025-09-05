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
exports.Cobro = void 0;
const typeorm_1 = require("typeorm");
const base_tenant_entity_1 = require("../../../common/entities/base-tenant.entity");
const cliente_entity_1 = require("../../clientes/cliente.entity");
const medio_cobro_entity_1 = require("./medio-cobro.entity");
const cobro_aplicacion_entity_1 = require("./cobro-aplicacion.entity");
let Cobro = class Cobro extends base_tenant_entity_1.BaseTenantEntity {
};
exports.Cobro = Cobro;
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], Cobro.prototype, "fecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Cobro.prototype, "numero", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Cobro.prototype, "clienteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cliente_entity_1.Cliente),
    (0, typeorm_1.JoinColumn)({ name: 'clienteId' }),
    __metadata("design:type", cliente_entity_1.Cliente)
], Cobro.prototype, "cliente", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Cobro.prototype, "medioId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => medio_cobro_entity_1.MedioCobro),
    (0, typeorm_1.JoinColumn)({ name: 'medioId' }),
    __metadata("design:type", medio_cobro_entity_1.MedioCobro)
], Cobro.prototype, "medio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 60, nullable: true }),
    __metadata("design:type", Object)
], Cobro.prototype, "comprobante", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], Cobro.prototype, "monto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], Cobro.prototype, "observaciones", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 12, default: 'CONFIRMADO' }),
    __metadata("design:type", String)
], Cobro.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => cobro_aplicacion_entity_1.CobroAplicacion, (a) => a.cobro, { cascade: true, eager: true }),
    __metadata("design:type", Array)
], Cobro.prototype, "aplicaciones", void 0);
exports.Cobro = Cobro = __decorate([
    (0, typeorm_1.Entity)('cobro'),
    (0, typeorm_1.Index)(['tenant_id', 'numero'], { unique: true })
], Cobro);
//# sourceMappingURL=cobro.entity.js.map