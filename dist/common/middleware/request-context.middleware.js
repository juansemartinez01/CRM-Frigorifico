"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestContextMiddleware = void 0;
const common_1 = require("@nestjs/common");
const request_context_1 = require("../request-context");
const constants_1 = require("../constants");
let RequestContextMiddleware = class RequestContextMiddleware {
    use(req, _res, next) {
        const tenantRaw = req.header(constants_1.TENANT_HEADER);
        const tenantId = tenantRaw ? Number(tenantRaw) : undefined;
        // Tomo la URL real sin query y tolero prefijo /api y barra final
        const path = (req.originalUrl || req.url).split('?')[0];
        const open = [
            { method: 'POST', re: /^(?:\/api)?\/tenants(?:\/.*)?$/ }, // /tenants o /api/tenants
            { method: 'POST', re: /^(?:\/api)?\/auth\/login$/ }, // /auth/login o /api/auth/login
            { method: 'GET', re: /^(?:\/api)?\/health$/ }, // /health o /api/health
        ];
        const isOpen = open.some(r => r.method === req.method && r.re.test(path));
        if (!tenantId && !isOpen) {
            throw new common_1.UnauthorizedException(`Falta cabecera ${constants_1.TENANT_HEADER}`);
        }
        const userId = req.user?.id ? Number(req.user.id) : undefined;
        request_context_1.RequestContext.run({ tenantId, userId }, () => next());
    }
};
exports.RequestContextMiddleware = RequestContextMiddleware;
exports.RequestContextMiddleware = RequestContextMiddleware = __decorate([
    (0, common_1.Injectable)()
], RequestContextMiddleware);
//# sourceMappingURL=request-context.middleware.js.map