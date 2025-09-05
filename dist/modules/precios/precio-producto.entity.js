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
exports.PrecioProducto = void 0;
const typeorm_1 = require("typeorm");
const base_tenant_entity_1 = require("../../common/entities/base-tenant.entity");
const lista_precio_entity_1 = require("./lista-precio.entity");
const producto_entity_1 = require("../productos/producto.entity");
let PrecioProducto = class PrecioProducto extends base_tenant_entity_1.BaseTenantEntity {
};
exports.PrecioProducto = PrecioProducto;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PrecioProducto.prototype, "listaId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => lista_precio_entity_1.ListaPrecio, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'listaId' }),
    __metadata("design:type", lista_precio_entity_1.ListaPrecio)
], PrecioProducto.prototype, "lista", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PrecioProducto.prototype, "productoId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => producto_entity_1.Producto, { eager: true, onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'productoId' }),
    __metadata("design:type", producto_entity_1.Producto)
], PrecioProducto.prototype, "producto", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'numeric', precision: 12, scale: 2 }),
    __metadata("design:type", String)
], PrecioProducto.prototype, "precio", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], PrecioProducto.prototype, "vigenciaDesde", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Object)
], PrecioProducto.prototype, "vigenciaHasta", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], PrecioProducto.prototype, "activo", void 0);
exports.PrecioProducto = PrecioProducto = __decorate([
    (0, typeorm_1.Entity)('precio_producto'),
    (0, typeorm_1.Index)(['tenant_id', 'listaId', 'productoId', 'vigenciaDesde', 'vigenciaHasta'])
], PrecioProducto);
//# sourceMappingURL=precio-producto.entity.js.map