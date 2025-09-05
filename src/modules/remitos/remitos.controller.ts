import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { RemitosService } from './remitos.service';
import { CreateRemitoDto } from './dto/create-remito.dto';
import { UpdateRemitoDto } from './dto/update-remito.dto';
import { QueryRemitoDto } from './dto/query-remito.dto';

@Controller('remitos')
export class RemitosController {
  constructor(private readonly service: RemitosService) {}

  @Post()
  create(@Body() dto: CreateRemitoDto) { return this.service.create(dto); }

  @Get()
  list(@Query() q: QueryRemitoDto) { return this.service.findAll(q); }

  @Get(':id')
  get(@Param('id') id: string) { return this.service.findOne(Number(id)); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRemitoDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(Number(id)); }
}
