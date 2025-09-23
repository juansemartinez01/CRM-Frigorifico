import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientoCuentaCorriente } from './movimiento-cta-cte.entity';
import { MovimientoCtaCteService } from './movimiento-cta-cte.service';
import { MovimientoCtaCteController } from './movimiento-cta-cte.controller';
import { CuentaCorrienteModule } from '@app/modules/cuenta-corriente/cuenta-corriente.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MovimientoCuentaCorriente]),
    forwardRef(() => CuentaCorrienteModule),
  ],
  providers: [MovimientoCtaCteService],
  controllers: [MovimientoCtaCteController],
  exports: [TypeOrmModule, MovimientoCtaCteService],
})
export class MovimientoCtaCteModule {}
