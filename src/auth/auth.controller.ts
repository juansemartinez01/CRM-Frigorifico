import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from './roles.enum';
import { Public } from './public.decorator';
import { LoginDto } from '@app/modules/users/dto/login.dto';
import { RegisterDto } from '@app/modules/users/dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

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
  login(@Body() body: LoginDto) {
    return this.auth.login(body.email, body.password, body.tenant);
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
