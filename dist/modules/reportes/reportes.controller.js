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
exports.ReportesController = void 0;
const common_1 = require("@nestjs/common");
const reportes_service_1 = require("./reportes.service");
const libro_query_dto_1 = require("./dto/libro-query.dto");
const request_context_1 = require("../../common/request-context");
let ReportesController = class ReportesController {
    constructor(service) {
        this.service = service;
    }
    async libro(q) {
        // Garantizamos contexto tenant
        if (!request_context_1.RequestContext.tenantId()) {
            // si tu middleware ya valida, esto nunca se ejecuta
            throw new Error('Falta X-Tenant-Id');
        }
        return this.service.libro(q);
    }
};
exports.ReportesController = ReportesController;
__decorate([
    (0, common_1.Get)('libro'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [libro_query_dto_1.LibroQueryDto]),
    __metadata("design:returntype", Promise)
], ReportesController.prototype, "libro", null);
exports.ReportesController = ReportesController = __decorate([
    (0, common_1.Controller)('reportes'),
    __metadata("design:paramtypes", [reportes_service_1.ReportesService])
], ReportesController);
//# sourceMappingURL=reportes.controller.js.map