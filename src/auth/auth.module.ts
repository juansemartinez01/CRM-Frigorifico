import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '@app/modules/users/users.module';

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => {
        const secret = cfg.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET no está definido');

        const issuer = cfg.get<string>('JWT_ISSUER'); // opcional
        const audience = cfg.get<string>('JWT_AUDIENCE'); // opcional
        const expiresIn = cfg.get<string>('JWT_EXPIRES_IN') ?? '8h';

        return {
          secret,
          signOptions: {
            expiresIn,
            ...(issuer ? { issuer } : {}),
            ...(audience ? { audience } : {}),
          },
        };
      },
    }),
  ],
  providers: [JwtStrategy, AuthService],
  controllers: [AuthController],
  exports: [JwtModule, AuthService],
})
export class AuthModule {}
