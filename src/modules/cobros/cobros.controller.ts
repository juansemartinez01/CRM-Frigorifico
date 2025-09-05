import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CobrosService } from './cobros.service';
import { CreateCobroDto } from './dto/create-cobro.dto';
import { UpdateCobroDto } from './dto/update-cobro.dto';
import { QueryCobroDto } from './dto/query-cobro.dto';

@Controller('cobros')
export class CobrosController {
  constructor(private readonly service: CobrosService) {}

  @Post()
  create(@Body() dto: CreateCobroDto) { return this.service.create(dto); }

  @Get()
  list(@Query() q: QueryCobroDto) { return this.service.findAll(q); }

  @Get(':id')
  get(@Param('id') id: string) { return this.service.findOne(Number(id)); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCobroDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(Number(id)); }
}
