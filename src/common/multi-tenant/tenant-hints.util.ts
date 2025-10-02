import { Request } from 'express';

/** Si configurás BASE_DOMAIN=miapp.com y pedís a foo.miapp.com => devuelve "foo". */
export function tenantFromHost(
  req: Request,
  baseDomain?: string,
): string | undefined {
  const host =
    (req.headers['x-forwarded-host'] as string) || req.headers.host || '';
  if (!host) return;
  const h = host.toString().split(':')[0]; // quita puerto
  if (!baseDomain) return;
  if (!h.endsWith(baseDomain)) return;
  const part = h.slice(0, -baseDomain.length).replace(/\.$/, ''); // quita ".miapp.com"
  if (!part) return;
  return part.toLowerCase();
}

export function tenantFromHeader(
  req: Request,
  headerName = 'X-Tenant-Id',
): string | undefined {
  const v = req.header(headerName);
  return v ? v.trim() : undefined;
}
