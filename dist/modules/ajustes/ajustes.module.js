"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AjustesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ajustes_controller_1 = require("./ajustes.controller");
const ajustes_service_1 = require("./ajustes.service");
const ajuste_cc_entity_1 = require("./entities/ajuste-cc.entity");
const cliente_entity_1 = require("../clientes/cliente.entity");
const movimientos_module_1 = require("../movimientos/movimientos.module");
let AjustesModule = class AjustesModule {
};
exports.AjustesModule = AjustesModule;
exports.AjustesModule = AjustesModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([ajuste_cc_entity_1.AjusteCC, cliente_entity_1.Cliente]), movimientos_module_1.MovimientosModule],
        controllers: [ajustes_controller_1.AjustesController],
        providers: [ajustes_service_1.AjustesService],
    })
], AjustesModule);
//# sourceMappingURL=ajustes.module.js.map