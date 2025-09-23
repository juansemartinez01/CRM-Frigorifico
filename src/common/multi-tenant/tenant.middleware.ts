import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';

declare module 'express-serve-static-core' {
  interface Request {
    tenantId?: string;
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly config: ConfigService) {}

  use(req: Request, _: Response, next: NextFunction) {
    const headerName =
      this.config.get<string>('TENANT_HEADER') || 'X-Tenant-Id';
    const fallback = this.config.get<string>('DEFAULT_TENANT') || 'public';

    const raw = req.header(headerName);
    const tenantId = (raw && String(raw).trim()) || fallback;

    req.tenantId = tenantId;
    next();
  }
}
