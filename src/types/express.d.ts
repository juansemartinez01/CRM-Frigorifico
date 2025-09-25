declare namespace Express {
  interface User {
    sub: string;
    email?: string;
    roles: string[]; // ['admin' | 'operator' | 'read']
    tid: string; // tenant id (obligatorio en JWT)
  }

  interface Request {
    tenantId?: string;
    user?: User;
  }
}
