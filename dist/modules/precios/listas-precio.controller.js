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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListasPrecioController = void 0;
const common_1 = require("@nestjs/common");
const listas_precio_service_1 = require("./listas-precio.service");
const create_lista_dto_1 = require("./dto/create-lista.dto");
const update_lista_dto_1 = require("./dto/update-lista.dto");
const query_lista_dto_1 = require("./dto/query-lista.dto");
let ListasPrecioController = class ListasPrecioController {
    constructor(service) {
        this.service = service;
    }
    create(dto) { return this.service.create(dto); }
    list(q) { return this.service.findAll(q); }
    get(id) { return this.service.findOne(Number(id)); }
    update(id, dto) {
        return this.service.update(Number(id), dto);
    }
    remove(id) { return this.service.remove(Number(id)); }
};
exports.ListasPrecioController = ListasPrecioController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_lista_dto_1.CreateListaDto]),
    __metadata("design:returntype", void 0)
], ListasPrecioController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_lista_dto_1.QueryListaDto]),
    __metadata("design:returntype", void 0)
], ListasPrecioController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ListasPrecioController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_lista_dto_1.UpdateListaDto]),
    __metadata("design:returntype", void 0)
], ListasPrecioController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ListasPrecioController.prototype, "remove", null);
exports.ListasPrecioController = ListasPrecioController = __decorate([
    (0, common_1.Controller)('listas-precio'),
    __metadata("design:paramtypes", [listas_precio_service_1.ListasPrecioService])
], ListasPrecioController);
//# sourceMappingURL=listas-precio.controller.js.map