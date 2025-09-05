import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientoCC } from './movimiento.entity';
import { MovimientosService } from './movimientos.service';

@Module({
  imports: [TypeOrmModule.forFeature([MovimientoCC])],
  providers: [MovimientosService],
  exports: [TypeOrmModule, MovimientosService],
})
export class MovimientosModule {}
