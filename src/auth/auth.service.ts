import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from './roles.enum';
import { UsersService } from '@app/modules/users/users.service';
import { User } from '@app/modules/users/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private jwt: JwtService,
    private cfg: ConfigService,
    private users: UsersService,
  ) {}

  devLogin(
    sub: string,
    tid: string,
    roles: Role[] = [Role.Read],
    email?: string,
  ) {
    const dev = this.cfg.get('AUTH_DEV') === 'true';
    if (!dev) throw new UnauthorizedException('Dev login deshabilitado');
    const payload = { sub, tid, roles, email };
    return {
      access_token: this.jwt.sign(payload),
      token_type: 'Bearer',
      expires_in: 8 * 3600,
    };
  }

  private signForUser(user: User) {
    const payload = {
      sub: user.id,
      tid: user.tenantId,
      roles: user.roles,
      email: user.email,
    };
    return {
      access_token: this.jwt.sign(payload),
      token_type: 'Bearer',
      expires_in: 8 * 3600,
    };
  }

  /** Login con derivación automática de tenant si no se envía. */
  async login(email: string, password: string, tenant?: string) {
    const emailNorm = email.toLowerCase().trim();

    let user: User | null = null;

    if (tenant) {
      user = await this.users.findByEmail(emailNorm, tenant);
    } else {
      const candidates = await this.users.findAllTenantsByEmail(emailNorm);
      if (candidates.length === 0)
        throw new UnauthorizedException('Credenciales inválidas');
      if (candidates.length > 1) {
        // Por seguridad, no devolvemos la lista de tenants
        throw new BadRequestException(
          'Este email está asociado a varias organizaciones. Indique el tenant.',
        );
      }
      user = candidates[0];
    }

    if (!user || !user.isActive)
      throw new UnauthorizedException('Credenciales inválidas');

    const ok = await this.users.validatePassword(user, password);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    return this.signForUser(user);
  }

  async register(params: {
    tenant: string;
    email: string;
    password: string;
    name?: string;
    roles?: string[];
  }) {
    const allow = this.cfg.get('AUTH_ALLOW_SELF_REGISTER') === 'true';
    if (!allow) throw new BadRequestException('Registro público deshabilitado');

    // Creamos el usuario dentro del tenant indicado
    // NOTA: UsersService usa req.tenantId → aquí no tenemos guard; inyectamos vía repos directamente
    // Para simplificar, hacemos una ruta de registro en controller que setea tenant en req.tenantId temporalmente.
    // O creamos directamente usando repo. Vamos a reusar UsersService "simulando" tenant en req:
    (this.users as any).req.tenantId = params.tenant;

    const created = await this.users.create({
      email: params.email,
      password: params.password,
      name: params.name,
      roles: params.roles?.length ? params.roles : ['read'],
    });
    return this.signForUser(created);
  }
}
