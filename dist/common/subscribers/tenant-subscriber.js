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
exports.TenantScopeSubscriber = void 0;
const typeorm_1 = require("typeorm");
const request_context_1 = require("../request-context");
let TenantScopeSubscriber = class TenantScopeSubscriber {
    constructor(dataSource) {
        dataSource.subscribers.push(this);
    }
    // Antes de insertar, si la entidad tiene tenant_id y no está seteado, lo copia del contexto
    beforeInsert(event) {
        const entity = event.entity;
        if (entity && 'tenant_id' in entity && (entity.tenant_id === undefined || entity.tenant_id === null)) {
            const tid = request_context_1.RequestContext.tenantId();
            if (typeof tid === 'number') {
                entity.tenant_id = tid;
            }
        }
    }
};
exports.TenantScopeSubscriber = TenantScopeSubscriber;
exports.TenantScopeSubscriber = TenantScopeSubscriber = __decorate([
    (0, typeorm_1.EventSubscriber)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], TenantScopeSubscriber);
//# sourceMappingURL=tenant-subscriber.js.map