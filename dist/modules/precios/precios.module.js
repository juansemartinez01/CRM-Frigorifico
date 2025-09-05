"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PreciosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const lista_precio_entity_1 = require("./lista-precio.entity");
const precio_producto_entity_1 = require("./precio-producto.entity");
const listas_precio_service_1 = require("./listas-precio.service");
const precios_service_1 = require("./precios.service");
const listas_precio_controller_1 = require("./listas-precio.controller");
const precios_controller_1 = require("./precios.controller");
const cliente_entity_1 = require("../clientes/cliente.entity");
const producto_entity_1 = require("../productos/producto.entity");
let PreciosModule = class PreciosModule {
};
exports.PreciosModule = PreciosModule;
exports.PreciosModule = PreciosModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([lista_precio_entity_1.ListaPrecio, precio_producto_entity_1.PrecioProducto, cliente_entity_1.Cliente, producto_entity_1.Producto])],
        providers: [listas_precio_service_1.ListasPrecioService, precios_service_1.PreciosService],
        controllers: [listas_precio_controller_1.ListasPrecioController, precios_controller_1.PreciosController],
        exports: [typeorm_1.TypeOrmModule],
    })
], PreciosModule);
//# sourceMappingURL=precios.module.js.map