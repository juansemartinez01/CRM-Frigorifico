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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProductoDto = void 0;
// src/modules/productos/dto/update-producto.dto.ts
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const trimOrUndef = (v) => {
    if (v === null || v === undefined)
        return undefined;
    const s = String(v).trim();
    return s.length ? s : undefined;
};
class UpdateProductoDto {
}
exports.UpdateProductoDto = UpdateProductoDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 120),
    (0, class_transformer_1.Transform)(({ value }) => trimOrUndef(value)),
    __metadata("design:type", String)
], UpdateProductoDto.prototype, "nombre", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 60),
    (0, class_transformer_1.Transform)(({ value }) => trimOrUndef(value)),
    __metadata("design:type", String)
], UpdateProductoDto.prototype, "sku", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProductoDto.prototype, "descripcion", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateProductoDto.prototype, "unidadId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => value !== undefined ? String(Number(value).toFixed(2)) : undefined),
    __metadata("design:type", String)
], UpdateProductoDto.prototype, "precioBase", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateProductoDto.prototype, "activo", void 0);
//# sourceMappingURL=update-producto.dto.js.map