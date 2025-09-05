import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RequestContext } from '../../common/request-context';

@Injectable()
export class AuthService {
  constructor(private users: UsersService, private jwt: JwtService) {}

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const ok = await bcrypt.compare(dto.password, user.password_hash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    const tenantId = RequestContext.tenantId();
    const payload = { sub: user.id, tenantId, roles: user.roles?.map(r => r.nombre) ?? [] };
    const access_token = await this.jwt.signAsync(payload);
    return { access_token, user: { id: user.id, nombre: user.nombre, email: user.email, roles: payload.roles } };
  }
}
