import { Controller, Post, Body, Get, Param, Query, Put } from '@nestjs/common';
import { MovimientoCtaCteService } from './movimiento-cta-cte.service';
import { CreateMovimientoDto } from './dto/create-movimiento.dto';
import { BuscarMovimientoDto } from './dto/buscar-movimiento.dto';
import { UpdateMovimientoDto } from './dto/update-movimiento.dto';

@Controller('movimientos-cta-cte')
export class MovimientoCtaCteController {
  constructor(private readonly service: MovimientoCtaCteService) {}

  @Post()
  create(@Body() dto: CreateMovimientoDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMovimientoDto) {
    return this.service.update(id, dto);
  }

  @Get()
  search(@Query() filtros: BuscarMovimientoDto) {
    return this.service.search(filtros);
  }

  @Get('cliente/:clienteId')
  listByCliente(@Param('clienteId') clienteId: string) {
    return this.service.listByCliente(clienteId);
  }
}
