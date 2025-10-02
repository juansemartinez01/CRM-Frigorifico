import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from './roles.enum';
import { Public } from './public.decorator';
import { LoginDto } from '@app/modules/users/dto/login.dto';
import { RegisterDto } from '@app/modules/users/dto/register.dto';
import { tenantFromHeader, tenantFromHost } from '@app/common/multi-tenant/tenant-hints.util';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService,
    private readonly cfg: ConfigService
  ) {}
  

  @Public()
  @Post('dev-login')
  devLogin(
    @Body() body: { sub: string; tid: string; roles?: Role[]; email?: string },
  ) {
    return this.auth.devLogin(
      body.sub,
      body.tid,
      body.roles ?? [Role.Read],
      body.email,
    );
  }

  @Public()
  @Post('login')
  login(@Body() body: LoginDto, @Req() req: Request) {
    // Orden de hints: body.tenant -> header -> subdominio
    const fromBody = body.tenant?.trim();
    const fromHeader = tenantFromHeader(
      req,
      this.cfg.get('TENANT_HEADER') || 'X-Tenant-Id',
    );
    const fromHost = tenantFromHost(
      req,
      this.cfg.get('BASE_DOMAIN') || undefined,
    );

    const hint = fromBody || fromHeader || fromHost;
    return this.auth.login(body.email, body.password, hint);
  }

  @Public()
  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.auth.register({
      tenant: body.tenant,
      email: body.email,
      password: body.password,
      name: body.name,
      roles: body.roles,
    });
  }
}
