import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContext } from '../request-context';
import { TENANT_HEADER } from '../constants';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const tenantRaw = req.header(TENANT_HEADER);
    const tenantId = tenantRaw ? Number(tenantRaw) : undefined;

    // Tomo la URL real sin query y tolero prefijo /api y barra final
    const path = (req.originalUrl || req.url).split('?')[0];

    const open = [
      { method: 'POST', re: /^(?:\/api)?\/tenants(?:\/.*)?$/ },  // /tenants o /api/tenants
      { method: 'POST', re: /^(?:\/api)?\/auth\/login$/ },       // /auth/login o /api/auth/login
      { method: 'GET',  re: /^(?:\/api)?\/health$/ },            // /health o /api/health
    ];
    const isOpen = open.some(r => r.method === req.method && r.re.test(path));

    if (!tenantId && !isOpen) {
      throw new UnauthorizedException(`Falta cabecera ${TENANT_HEADER}`);
    }

    const userId = (req as any).user?.id ? Number((req as any).user.id) : undefined;
    RequestContext.run({ tenantId, userId }, () => next());
  }
}
