import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

type JwtPayload = {
  sub: string;
  email?: string;
  roles?: string[]; // ['admin' | 'operator' | 'read']
  tid?: string; // tenant id
  iss?: string;
  aud?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(cfg: ConfigService) {
    const secret = cfg.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in configuration');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer: cfg.get<string>('JWT_ISSUER') || undefined,
      audience: cfg.get<string>('JWT_AUDIENCE') || undefined,
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub)
      throw new UnauthorizedException('Token inválido (sin sub)');
    if (!payload?.tid)
      throw new UnauthorizedException('Token inválido (sin tid/tenant)');

    const roles = Array.isArray(payload.roles) ? payload.roles : ['read'];
    return {
      sub: String(payload.sub),
      email: payload.email,
      roles,
      tid: String(payload.tid),
    } as Express.User;
  }
}
