import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { MediosCobroService } from './medios-cobro.service';

@Controller('medios-cobro')
export class MediosCobroController {
  constructor(private readonly service: MediosCobroService) {}

  @Post()
  create(@Body() dto: { nombre: string; tipo?: string; activo?: boolean }) {
    return this.service.create(dto);
  }

  @Get()
  list(@Query() q: { q?: string; activo?: 'true' | 'false' }) {
    return this.service.list(q);
  }

  @Get(':id')
  get(@Param('id') id: string) { return this.service.findOne(Number(id)); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
