import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoResolucionController } from './pedido-resolucion.controller';
import { PedidoResolucionService } from './pedido-resolucion.service';
import { Pedido } from '@app/modules/pedido/pedido.entity';
import { Cliente } from '@app/modules/cliente/cliente.entity';
import { PedidoResolucion } from './pedido-resolucion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, Cliente, PedidoResolucion])],
  controllers: [PedidoResolucionController],
  providers: [PedidoResolucionService],
  exports: [PedidoResolucionService],
})
export class PedidoResolucionModule {}
