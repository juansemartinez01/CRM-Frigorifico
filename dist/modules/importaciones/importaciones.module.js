"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportacionesModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const importaciones_controller_1 = require("./importaciones.controller");
const importaciones_service_1 = require("./importaciones.service");
const import_map_entity_1 = require("./entities/import-map.entity");
const cliente_entity_1 = require("../clientes/cliente.entity");
const unidad_entity_1 = require("../unidades/unidad.entity");
const producto_entity_1 = require("../productos/producto.entity");
const remitos_module_1 = require("../remitos/remitos.module");
let ImportacionesModule = class ImportacionesModule {
};
exports.ImportacionesModule = ImportacionesModule;
exports.ImportacionesModule = ImportacionesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([import_map_entity_1.ImportMap, cliente_entity_1.Cliente, unidad_entity_1.Unidad, producto_entity_1.Producto]),
            remitos_module_1.RemitosModule,
        ],
        controllers: [importaciones_controller_1.ImportacionesController],
        providers: [importaciones_service_1.ImportacionesService],
    })
], ImportacionesModule);
//# sourceMappingURL=importaciones.module.js.map