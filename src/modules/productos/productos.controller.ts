import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { QueryProductoDto } from './dto/query-producto.dto';

@Controller('productos')
export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  @Post()
  create(@Body() dto: CreateProductoDto) { return this.service.create(dto); }

  @Get()
  list(@Query() q: QueryProductoDto) { return this.service.findAll(q); }

  @Get(':id')
  get(@Param('id') id: string) { return this.service.findOne(Number(id)); }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductoDto) { return this.service.update(Number(id), dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(Number(id)); }
}
