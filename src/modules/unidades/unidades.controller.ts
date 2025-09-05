import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { UnidadesService } from './unidades.service';
import { CreateUnidadDto } from './dto/create-unidad.dto';
import { UpdateUnidadDto } from './dto/update-unidad.dto';
import { QueryUnidadDto } from './dto/query-unidad.dto';

@Controller('unidades')
export class UnidadesController {
  constructor(private readonly service: UnidadesService) {}

  @Post()
  create(@Body() dto: CreateUnidadDto) { return this.service.create(dto); }

  @Get()
  list(@Query() q: QueryUnidadDto) { return this.service.findAll(q); }

  @Get(':id')
  get(@Param('id') id: string) { return this.service.findOne(Number(id)); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUnidadDto) { return this.service.update(Number(id), dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(Number(id)); }
}
