"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CobrosModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const cobros_controller_1 = require("./cobros.controller");
const medios_cobro_controller_1 = require("./medios-cobro.controller");
const cobros_service_1 = require("./cobros.service");
const medios_cobro_service_1 = require("./medios-cobro.service");
const cobro_entity_1 = require("./entities/cobro.entity");
const cobro_aplicacion_entity_1 = require("./entities/cobro-aplicacion.entity");
const medio_cobro_entity_1 = require("./entities/medio-cobro.entity");
const cliente_entity_1 = require("../clientes/cliente.entity");
const remito_venta_entity_1 = require("../remitos/entities/remito-venta.entity");
const movimientos_module_1 = require("../movimientos/movimientos.module");
let CobrosModule = class CobrosModule {
};
exports.CobrosModule = CobrosModule;
exports.CobrosModule = CobrosModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([cobro_entity_1.Cobro, cobro_aplicacion_entity_1.CobroAplicacion, medio_cobro_entity_1.MedioCobro, cliente_entity_1.Cliente, remito_venta_entity_1.RemitoVenta]), movimientos_module_1.MovimientosModule],
        controllers: [cobros_controller_1.CobrosController, medios_cobro_controller_1.MediosCobroController],
        providers: [cobros_service_1.CobrosService, medios_cobro_service_1.MediosCobroService],
        exports: [typeorm_1.TypeOrmModule],
    })
], CobrosModule);
//# sourceMappingURL=cobros.module.js.map