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
exports.RemitoVenta = void 0;
const typeorm_1 = require("typeorm");
const base_tenant_entity_1 = require("../../../common/entities/base-tenant.entity");
const cliente_entity_1 = require("../../clientes/cliente.entity");
const user_entity_1 = require("../../users/user.entity");
const remito_item_entity_1 = require("./remito-item.entity");
let RemitoVenta = class RemitoVenta extends base_tenant_entity_1.BaseTenantEntity {
};
exports.RemitoVenta = RemitoVenta;
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], RemitoVenta.prototype, "fecha", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], RemitoVenta.prototype, "numero", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], RemitoVenta.prototype, "clienteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cliente_entity_1.Cliente),
    (0, typeorm_1.JoinColumn)({ name: 'clienteId' }),
    __metadata("design:type", cliente_entity_1.Cliente)
], RemitoVenta.prototype, "cliente", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], RemitoVenta.prototype, "usuarioId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'usuarioId' }),
    __metadata("design:type", Object)
], RemitoVenta.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], RemitoVenta.prototype, "observaciones", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", String)
], RemitoVenta.prototype, "subtotal", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 14, scale: 2, default: 0 }),
    __metadata("design:type", String)
], RemitoVenta.prototype, "total", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 12, default: 'CONFIRMADO' }),
    __metadata("design:type", String)
], RemitoVenta.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => remito_item_entity_1.RemitoItem, (i) => i.remito, { cascade: true, eager: true }),
    __metadata("design:type", Array)
], RemitoVenta.prototype, "items", void 0);
exports.RemitoVenta = RemitoVenta = __decorate([
    (0, typeorm_1.Entity)('remito_venta'),
    (0, typeorm_1.Index)(['tenant_id', 'numero'], { unique: true })
], RemitoVenta);
//# sourceMappingURL=remito-venta.entity.js.map