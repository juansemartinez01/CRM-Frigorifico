import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  Patch,
} from '@nestjs/common';
import { PedidoService } from './pedido.service';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { BuscarPedidoDto } from './dto/buscar-pedido.dto';
import { ConfirmarPedidoDto } from './dto/confirmar-pedido.dto';
import { ModificarConfirmacionDto } from './dto/modificar-confirmacion.dto';

@Controller('pedidos')
export class PedidoController {
  constructor(private readonly service: PedidoService) {}

  @Post()
  create(@Body() dto: CreatePedidoDto) {
    return this.service.create(dto);
  }

  @Post('confirmar')
  confirmar(@Body() dto: ConfirmarPedidoDto) {
    return this.service.confirmarPedido(dto);
  }

  @Get('por-remito/:numero')
  async getPorRemito(@Param('numero') numero: string) {
    return this.service.getPorRemito(numero);
  }

  @Get('por-cliente')
  async getPorCliente(
    @Query('clienteId') clienteId: string,
    @Query('fechaDesde') fechaDesde: string, // YYYY-MM-DD
    @Query('fechaHasta') fechaHasta: string, // YYYY-MM-DD
  ) {
    return this.service.getPorCliente({ clienteId, fechaDesde, fechaHasta });
  }

  @Get()
  search(@Query() filtros: BuscarPedidoDto) {
    return this.service.search(filtros);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePedidoDto) {
    return this.service.update(id, dto);
  }

  @Delete('no-confirmados')
  deleteNoConfirmados() {
    return this.service.deleteNoConfirmados();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch('confirmar')
  modificarConfirmacion(@Body() dto: ModificarConfirmacionDto) {
    return this.service.modificarConfirmacion(dto);
  }
}
