import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ClientesService } from './clientes.service';
import { CreateClienteDto } from './dto/create-cliente.dto';
import { UpdateClienteDto } from './dto/update-cliente.dto';
import { QueryClienteDto } from './dto/query-cliente.dto';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  @Post()
  create(@Body() dto: CreateClienteDto) {
    return this.service.create(dto);
  }

  @Get()
  list(@Query() query: QueryClienteDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClienteDto) {
    return this.service.update(Number(id), dto);
  }

  @Patch(':id/activar')
  activar(@Param('id') id: string) {
    return this.service.activar(Number(id));
  }

  @Patch(':id/desactivar')
  desactivar(@Param('id') id: string) {
    return this.service.desactivar(Number(id));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
