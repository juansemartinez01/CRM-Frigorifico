import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AjustesController } from './ajustes.controller';
import { AjustesService } from './ajustes.service';
import { AjusteCC } from './entities/ajuste-cc.entity';
import { Cliente } from '../clientes/cliente.entity';
import { MovimientosModule } from '../movimientos/movimientos.module';

@Module({
  imports: [TypeOrmModule.forFeature([AjusteCC, Cliente]), MovimientosModule],
  controllers: [AjustesController],
  providers: [AjustesService],
})
export class AjustesModule {}
