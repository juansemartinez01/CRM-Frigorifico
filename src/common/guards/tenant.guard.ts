import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private cfg: ConfigService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as Express.User | undefined;

    if (user?.tid) {
      req.tenantId = user.tid;
      return true;
    }

    // Fallback opcional (solo si ALLOW_HEADER_TENANT=true)
    const allowHeader = this.cfg.get('ALLOW_HEADER_TENANT') === 'true';
    if (allowHeader) {
      const headerName = this.cfg.get<string>('TENANT_HEADER') || 'X-Tenant-Id';
      const fallback = this.cfg.get<string>('DEFAULT_TENANT') || 'public';
      req.tenantId = (req.header(headerName) || fallback).trim();
      return true;
    }

    throw new UnauthorizedException('No se pudo determinar el tenant (tid)');
  }
}
