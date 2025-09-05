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
exports.ListaPrecio = void 0;
const typeorm_1 = require("typeorm");
const base_tenant_entity_1 = require("../../common/entities/base-tenant.entity");
const cliente_entity_1 = require("../clientes/cliente.entity");
let ListaPrecio = class ListaPrecio extends base_tenant_entity_1.BaseTenantEntity {
};
exports.ListaPrecio = ListaPrecio;
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], ListaPrecio.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20, default: 'GENERAL' }),
    __metadata("design:type", String)
], ListaPrecio.prototype, "tipo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Object)
], ListaPrecio.prototype, "clienteId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => cliente_entity_1.Cliente, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'clienteId' }),
    __metadata("design:type", Object)
], ListaPrecio.prototype, "cliente", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10, default: 'ARS' }),
    __metadata("design:type", String)
], ListaPrecio.prototype, "moneda", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], ListaPrecio.prototype, "notas", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: true }),
    __metadata("design:type", Boolean)
], ListaPrecio.prototype, "activo", void 0);
exports.ListaPrecio = ListaPrecio = __decorate([
    (0, typeorm_1.Entity)('lista_precio'),
    (0, typeorm_1.Index)(['tenant_id', 'nombre'], { unique: true })
], ListaPrecio);
//# sourceMappingURL=lista-precio.entity.js.map