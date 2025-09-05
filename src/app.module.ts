import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Tenant } from './modules/tenants/tenant.entity';
import { User } from './modules/users/user.entity';
import { Role } from './modules/roles/role.entity';
import { UserRole } from './modules/roles/user-role.entity';

import { TenantsModule } from './modules/tenants/tenants.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { AuthModule } from './modules/auth/auth.module';

import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { TenantScopeSubscriber } from './common/subscribers/tenant-subscriber';
import { HealthController } from './health.controller';
import { ClientesModule } from './modules/clientes/clientes.module';
import { UnidadesModule } from './modules/unidades/unidades.module';
import { ProductosModule } from './modules/productos/productos.module';
import { PreciosModule } from './modules/precios/precios.module';
import { MovimientosModule } from './modules/movimientos/movimientos.module';
import { RemitosModule } from './modules/remitos/remitos.module';
import { CobrosModule } from './modules/cobros/cobros.module';
import { CuentaCorrienteModule } from './modules/cuenta-corriente/cuenta-corriente.module';
import { AjustesModule } from './modules/ajustes/ajustes.module';
import { ImportacionesModule } from './modules/importaciones/importaciones.module';
import { ReportesModule } from './modules/reportes/reportes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        url: cfg.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: true, // DEV: true; PROD: usar migraciones
        logging: false
      }),
    }),
    TypeOrmModule.forFeature([Tenant, User, Role, UserRole]),
    RolesModule,
    TenantsModule,
    UsersModule,
    AuthModule,
    ClientesModule,
    UnidadesModule,
    ProductosModule,
    PreciosModule,
    MovimientosModule,
    RemitosModule,
    CobrosModule,
    CuentaCorrienteModule,
    AjustesModule,
    ImportacionesModule,
    ReportesModule,
  ],
  providers: [TenantScopeSubscriber],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
