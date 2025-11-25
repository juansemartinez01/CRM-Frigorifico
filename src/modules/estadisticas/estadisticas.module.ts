import { Module, Scope } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EstadisticasController } from './estadisticas.controller';
import { EstadisticasService } from './estadisticas.service';

import { Pedido } from '@app/modules/pedido/pedido.entity';
import { MovimientoCuentaCorriente } from '@app/modules/mov-cta-cte/movimiento-cta-cte.entity';
import { CuentaCorriente } from '@app/modules/cuenta-corriente/cuenta-corriente.entity';
import { Cliente } from '@app/modules/cliente/cliente.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pedido,
      MovimientoCuentaCorriente,
      CuentaCorriente,
      Cliente,
    ]),
  ],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
  exports: [EstadisticasService],
})
export class EstadisticasModule {}
