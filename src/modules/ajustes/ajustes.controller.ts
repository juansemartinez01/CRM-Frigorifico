import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AjustesService } from './ajustes.service';
import { CreateAjusteDto } from './dto/create-ajuste.dto';
import { UpdateAjusteDto } from './dto/update-ajuste.dto';
import { QueryAjusteDto } from './dto/query-ajuste.dto';

@Controller('ajustes-cc')
export class AjustesController {
  constructor(private readonly service: AjustesService) {}

  @Post()
  create(@Body() dto: CreateAjusteDto) {
    return this.service.create(dto);
  }

  @Get()
  list(@Query() q: QueryAjusteDto) {
    return this.service.findAll(q);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAjusteDto) {
    return this.service.update(Number(id), dto);
  }

  @Patch(':id/anular')
  anular(@Param('id') id: string) {
    return this.service.anular(Number(id));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
