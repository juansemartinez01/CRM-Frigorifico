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
exports.CuentaCorrienteController = void 0;
const common_1 = require("@nestjs/common");
const cuenta_corriente_service_1 = require("./cuenta-corriente.service");
const query_saldos_dto_1 = require("./dto/query-saldos.dto");
const query_extracto_dto_1 = require("./dto/query-extracto.dto");
let CuentaCorrienteController = class CuentaCorrienteController {
    constructor(service) {
        this.service = service;
    }
    // GET /cuentas-corriente/saldos?q=&filtro=&orderBy=&order=&page=&limit=
    saldos(q) {
        return this.service.saldos(q);
    }
    // GET /cuentas-corriente/:clienteId/saldo
    saldoCliente(clienteId) {
        return this.service.saldoCliente(Number(clienteId));
    }
    // GET /cuentas-corriente/:clienteId/extracto?desde=&hasta=&order=&page=&limit=
    extracto(clienteId, q) {
        return this.service.extracto(Number(clienteId), q);
    }
    // GET /cuentas-corriente/:clienteId/remitos-abiertos
    remitosAbiertos(clienteId) {
        return this.service.remitosAbiertos(Number(clienteId));
    }
};
exports.CuentaCorrienteController = CuentaCorrienteController;
__decorate([
    (0, common_1.Get)('saldos'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [query_saldos_dto_1.QuerySaldosDto]),
    __metadata("design:returntype", void 0)
], CuentaCorrienteController.prototype, "saldos", null);
__decorate([
    (0, common_1.Get)(':clienteId/saldo'),
    __param(0, (0, common_1.Param)('clienteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CuentaCorrienteController.prototype, "saldoCliente", null);
__decorate([
    (0, common_1.Get)(':clienteId/extracto'),
    __param(0, (0, common_1.Param)('clienteId')),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, query_extracto_dto_1.QueryExtractoDto]),
    __metadata("design:returntype", void 0)
], CuentaCorrienteController.prototype, "extracto", null);
__decorate([
    (0, common_1.Get)(':clienteId/remitos-abiertos'),
    __param(0, (0, common_1.Param)('clienteId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CuentaCorrienteController.prototype, "remitosAbiertos", null);
exports.CuentaCorrienteController = CuentaCorrienteController = __decorate([
    (0, common_1.Controller)('cuentas-corriente'),
    __metadata("design:paramtypes", [cuenta_corriente_service_1.CuentaCorrienteService])
], CuentaCorrienteController);
//# sourceMappingURL=cuenta-corriente.controller.js.map