import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuentaCorriente } from './cuenta-corriente.entity';
import { CuentaCorrienteService } from './cuenta-corriente.service';
import { CuentaCorrienteController } from './cuenta-corriente.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CuentaCorriente])],
  providers: [CuentaCorrienteService],
  controllers: [CuentaCorrienteController],
  exports: [TypeOrmModule, CuentaCorrienteService],
})
export class CuentaCorrienteModule {}
