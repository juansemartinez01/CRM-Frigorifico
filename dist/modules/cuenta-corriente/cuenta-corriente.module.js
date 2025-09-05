"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CuentaCorrienteModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const cuenta_corriente_service_1 = require("./cuenta-corriente.service");
const cuenta_corriente_controller_1 = require("./cuenta-corriente.controller");
const movimiento_entity_1 = require("../movimientos/movimiento.entity");
const cliente_entity_1 = require("../clientes/cliente.entity");
const remito_venta_entity_1 = require("../remitos/entities/remito-venta.entity");
const cobro_entity_1 = require("../cobros/entities/cobro.entity");
const cobro_aplicacion_entity_1 = require("../cobros/entities/cobro-aplicacion.entity");
let CuentaCorrienteModule = class CuentaCorrienteModule {
};
exports.CuentaCorrienteModule = CuentaCorrienteModule;
exports.CuentaCorrienteModule = CuentaCorrienteModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([movimiento_entity_1.MovimientoCC, cliente_entity_1.Cliente, remito_venta_entity_1.RemitoVenta, cobro_entity_1.Cobro, cobro_aplicacion_entity_1.CobroAplicacion])],
        providers: [cuenta_corriente_service_1.CuentaCorrienteService],
        controllers: [cuenta_corriente_controller_1.CuentaCorrienteController],
    })
], CuentaCorrienteModule);
//# sourceMappingURL=cuenta-corriente.module.js.map