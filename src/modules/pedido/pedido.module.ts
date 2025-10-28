import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './pedido.entity';
import { PedidoService } from './pedido.service';
import { PedidoController } from './pedido.controller';
import { MovimientoCuentaCorriente } from '../mov-cta-cte/movimiento-cta-cte.entity';
import { CuentaCorriente } from '../cuenta-corriente/cuenta-corriente.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Pedido,
      MovimientoCuentaCorriente,
      CuentaCorriente,
    ]),
  ],
  providers: [PedidoService],
  controllers: [PedidoController],
  exports: [TypeOrmModule, PedidoService],
})
export class PedidoModule {}
