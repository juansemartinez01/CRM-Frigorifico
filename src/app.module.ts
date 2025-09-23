import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Importaremos nuestros módulos de dominio más adelante
// import { ClienteModule } from './modules/cliente/cliente.module';

import { TenantMiddleware } from './common/multi-tenant/tenant.middleware';
import { RazonSocialModule } from './modules/razon-social/razon-social.module';
import { MovimientoCtaCteModule } from './modules/mov-cta-cte/movimiento-cta-cte.module';
import { ClienteModule } from './modules/cliente/cliente.module';
import { CuentaCorrienteModule } from './modules/cuenta-corriente/cuenta-corriente.module';
import { PedidoModule } from './modules/pedido/pedido.module';
import { RevendedorModule } from './modules/revendedor/revendedor.module';
import { TenantBaseEntity } from './common/entities/tenant-base.entity';
import { PedidoImportModule } from './modules/pedido-import/pedido-import.module';
import { PedidoResolucionModule } from './modules/pedido-resolucion/pedido-resolucion.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DB_HOST'),
        port: cfg.get<number>('DB_PORT'),
        username: cfg.get('DB_USER'),
        password: cfg.get('DB_PASS'),
        database: cfg.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: cfg.get('DB_SYNCHRONIZE') === 'true',
        logging: cfg.get('DB_LOGGING') === 'true',
      }),
    }),
    RazonSocialModule,

    RevendedorModule,
    ClienteModule,
    PedidoModule,
    CuentaCorrienteModule,
    MovimientoCtaCteModule,
    PedidoImportModule,
    PedidoResolucionModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
