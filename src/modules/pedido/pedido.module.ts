import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from './pedido.entity';
import { PedidoService } from './pedido.service';
import { PedidoController } from './pedido.controller';
import { MovimientoCuentaCorriente } from '../mov-cta-cte/movimiento-cta-cte.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, MovimientoCuentaCorriente])],
  providers: [PedidoService],
  controllers: [PedidoController],
  exports: [TypeOrmModule, PedidoService],
})
export class PedidoModule {}
