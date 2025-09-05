"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemitosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const remitos_controller_1 = require("./remitos.controller");
const remitos_service_1 = require("./remitos.service");
const remito_venta_entity_1 = require("./entities/remito-venta.entity");
const remito_item_entity_1 = require("./entities/remito-item.entity");
const movimientos_module_1 = require("../movimientos/movimientos.module");
const producto_entity_1 = require("../productos/producto.entity");
const cliente_entity_1 = require("../clientes/cliente.entity");
let RemitosModule = class RemitosModule {
};
exports.RemitosModule = RemitosModule;
exports.RemitosModule = RemitosModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([remito_venta_entity_1.RemitoVenta, remito_item_entity_1.RemitoItem, producto_entity_1.Producto, cliente_entity_1.Cliente]), movimientos_module_1.MovimientosModule],
        controllers: [remitos_controller_1.RemitosController],
        providers: [remitos_service_1.RemitosService],
        exports: [typeorm_1.TypeOrmModule, remitos_service_1.RemitosService],
    })
], RemitosModule);
//# sourceMappingURL=remitos.module.js.map