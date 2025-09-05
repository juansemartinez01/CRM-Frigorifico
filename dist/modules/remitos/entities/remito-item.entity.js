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
exports.RemitoItem = void 0;
const typeorm_1 = require("typeorm");
const base_tenant_entity_1 = require("../../../common/entities/base-tenant.entity");
const remito_venta_entity_1 = require("./remito-venta.entity");
const producto_entity_1 = require("../../productos/producto.entity");
let RemitoItem = class RemitoItem extends base_tenant_entity_1.BaseTenantEntity {
};
exports.RemitoItem = RemitoItem;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], RemitoItem.prototype, "remitoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => remito_venta_entity_1.RemitoVenta, (r) => r.items, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'remitoId' }),
    __metadata("design:type", remito_venta_entity_1.RemitoVenta)
], RemitoItem.prototype, "remito", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], RemitoItem.prototype, "productoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => producto_entity_1.Producto, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'productoId' }),
    __metadata("design:type", producto_entity_1.Producto)
], RemitoItem.prototype, "producto", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], RemitoItem.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 14, scale: 3 }),
    __metadata("design:type", String)
], RemitoItem.prototype, "cantidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2 }),
    __metadata("design:type", String)
], RemitoItem.prototype, "precio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 14, scale: 2 }),
    __metadata("design:type", String)
], RemitoItem.prototype, "subtotal", void 0);
exports.RemitoItem = RemitoItem = __decorate([
    (0, typeorm_1.Check)('CHK_remito_item_cant_pos', 'cantidad::numeric >= 0'),
    (0, typeorm_1.Check)('CHK_remito_item_prec_pos', 'precio::numeric  >= 0'),
    (0, typeorm_1.Entity)('remito_item')
], RemitoItem);
//# sourceMappingURL=remito-item.entity.js.map