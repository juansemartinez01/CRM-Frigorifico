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
exports.Producto = void 0;
// src/modules/productos/producto.entity.ts
const typeorm_1 = require("typeorm");
const base_tenant_entity_1 = require("../../common/entities/base-tenant.entity");
const unidad_entity_1 = require("../unidades/unidad.entity");
let Producto = class Producto extends base_tenant_entity_1.BaseTenantEntity {
};
exports.Producto = Producto;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 120 }),
    __metadata("design:type", String)
], Producto.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 60, nullable: true }),
    __metadata("design:type", Object)
], Producto.prototype, "sku", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", Object)
], Producto.prototype, "descripcion", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Producto.prototype, "unidadId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => unidad_entity_1.Unidad, { eager: true }),
    (0, typeorm_1.JoinColumn)({ name: 'unidadId' }),
    __metadata("design:type", unidad_entity_1.Unidad)
], Producto.prototype, "unidad", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2, nullable: true }),
    __metadata("design:type", Object)
], Producto.prototype, "precioBase", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: true }),
    __metadata("design:type", Boolean)
], Producto.prototype, "activo", void 0);
exports.Producto = Producto = __decorate([
    (0, typeorm_1.Entity)('producto'),
    (0, typeorm_1.Index)('UQ_producto_nombre_unidad_por_tenant', ['tenant_id', 'nombre', 'unidadId'], { unique: true })
    // SKU único solo si está presente (índice parcial)
    ,
    (0, typeorm_1.Index)('UQ_producto_sku_por_tenant_notnull', ['tenant_id', 'sku'], {
        unique: true,
        where: `"sku" IS NOT NULL AND "sku" <> ''`,
    })
], Producto);
//# sourceMappingURL=producto.entity.js.map