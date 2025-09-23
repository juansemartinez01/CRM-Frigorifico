import { Request } from 'express';

export function getTenantIdFromReq(req: Request): string {
  return req.tenantId ?? 'public';
}
