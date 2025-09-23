import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PedidoResolucionService } from './pedido-resolucion.service';
import { ListarPendientesDto } from './dto/listar-pendientes.dto';
import { ResolvePedidoDto } from './dto/resolve-pedido.dto';

@Controller('pedidos')
export class PedidoResolucionController {
  constructor(private readonly service: PedidoResolucionService) {}

  @Get('pendientes')
  listarPendientes(@Query() q: ListarPendientesDto) {
    return this.service.listarPendientes(q);
  }

  @Post('resolver-cliente')
  resolver(@Body() dto: ResolvePedidoDto) {
    return this.service.resolverCliente(dto);
  }
}
