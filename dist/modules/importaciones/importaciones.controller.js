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
exports.ImportacionesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const importaciones_service_1 = require("./importaciones.service");
// import { File as MulterFile } from 'multer';
let ImportacionesController = class ImportacionesController {
    constructor(service) {
        this.service = service;
    }
    async importRemitosExcel(file) {
        if (!file)
            throw new common_1.BadRequestException('Subí un archivo en el campo "file" (multipart/form-data) con nombre "file"');
        return this.service.importDetalleRemitos(file.buffer);
    }
};
exports.ImportacionesController = ImportacionesController;
__decorate([
    (0, common_1.Post)('remitos-excel'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ImportacionesController.prototype, "importRemitosExcel", null);
exports.ImportacionesController = ImportacionesController = __decorate([
    (0, common_1.Controller)('importaciones'),
    __metadata("design:paramtypes", [importaciones_service_1.ImportacionesService])
], ImportacionesController);
//# sourceMappingURL=importaciones.controller.js.map