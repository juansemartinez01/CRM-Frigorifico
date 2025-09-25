import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from './tenant.entity';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { RazonSocial } from '@app/modules/razon-social/razon-social.entity';
import { Cliente } from '@app/modules/cliente/cliente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, RazonSocial, Cliente])],
  providers: [TenantService],
  controllers: [TenantController],
  exports: [TenantService],
})
export class TenantModule {}
