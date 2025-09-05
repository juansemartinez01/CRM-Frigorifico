import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PreciosService } from './precios.service';
import { CreatePrecioDto } from './dto/create-precio.dto';
import { UpdatePrecioDto } from './dto/update-precio.dto';
import { QueryPrecioDto } from './dto/query-precio.dto';

@Controller('listas-precio/:listaId/precios')
export class PreciosController {
  constructor(private readonly service: PreciosService) {}

  @Post()
  create(@Param('listaId') listaId: string, @Body() dto: CreatePrecioDto) {
    return this.service.create(Number(listaId), dto);
  }

  @Get()
  list(@Param('listaId') listaId: string, @Query() q: QueryPrecioDto) {
    return this.service.findAll(Number(listaId), q);
  }

  @Get(':id')
  get(@Param('listaId') listaId: string, @Param('id') id: string) {
    return this.service.findOne(Number(listaId), Number(id));
  }

  @Patch(':id')
  update(@Param('listaId') listaId: string, @Param('id') id: string, @Body() dto: UpdatePrecioDto) {
    return this.service.update(Number(listaId), Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('listaId') listaId: string, @Param('id') id: string) {
    return this.service.remove(Number(listaId), Number(id));
  }
}
