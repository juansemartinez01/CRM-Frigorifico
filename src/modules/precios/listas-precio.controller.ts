import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ListasPrecioService } from './listas-precio.service';
import { CreateListaDto } from './dto/create-lista.dto';
import { UpdateListaDto } from './dto/update-lista.dto';
import { QueryListaDto } from './dto/query-lista.dto';

@Controller('listas-precio')
export class ListasPrecioController {
  constructor(private readonly service: ListasPrecioService) {}

  @Post()
  create(@Body() dto: CreateListaDto) { return this.service.create(dto); }

  @Get()
  list(@Query() q: QueryListaDto) { return this.service.findAll(q); }

  @Get(':id')
  get(@Param('id') id: string) { return this.service.findOne(Number(id)); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateListaDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(Number(id)); }
}
