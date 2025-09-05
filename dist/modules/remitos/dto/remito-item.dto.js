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
exports.RemitoItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class RemitoItemDto {
}
exports.RemitoItemDto = RemitoItemDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RemitoItemDto.prototype, "productoId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(1, 120),
    __metadata("design:type", String)
], RemitoItemDto.prototype, "descripcion", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value === undefined || value === null ? value : String(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d+(\.\d{1,3})?$/, { message: 'cantidad debe tener hasta 3 decimales' }),
    __metadata("design:type", String)
], RemitoItemDto.prototype, "cantidad", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => value === undefined || value === null ? value : String(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^\d+(\.\d{1,2})?$/, { message: 'precio debe tener hasta 2 decimales' }),
    __metadata("design:type", String)
], RemitoItemDto.prototype, "precio", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], RemitoItemDto.prototype, "id", void 0);
//# sourceMappingURL=remito-item.dto.js.map