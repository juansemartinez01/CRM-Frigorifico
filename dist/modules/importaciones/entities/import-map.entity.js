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
exports.ImportMap = void 0;
const typeorm_1 = require("typeorm");
const base_tenant_entity_1 = require("../../../common/entities/base-tenant.entity");
let ImportMap = class ImportMap extends base_tenant_entity_1.BaseTenantEntity {
};
exports.ImportMap = ImportMap;
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 80 }),
    __metadata("design:type", String)
], ImportMap.prototype, "source", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 160 }),
    __metadata("design:type", String)
], ImportMap.prototype, "external_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 40 }),
    __metadata("design:type", String)
], ImportMap.prototype, "entity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], ImportMap.prototype, "entityId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', nullable: true }),
    __metadata("design:type", Object)
], ImportMap.prototype, "raw", void 0);
exports.ImportMap = ImportMap = __decorate([
    (0, typeorm_1.Entity)('import_map'),
    (0, typeorm_1.Index)(['tenant_id', 'source', 'external_id'], { unique: true })
], ImportMap);
//# sourceMappingURL=import-map.entity.js.map