import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { RevendedorService } from './revendedor.service';
import { CreateRevendedorDto } from './dto/create-revendedor.dto';
import { UpdateRevendedorDto } from './dto/update-revendedor.dto';

@Controller('revendedores')
export class RevendedorController {
  constructor(private readonly service: RevendedorService) {}

  @Post()
  create(@Body() dto: CreateRevendedorDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRevendedorDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
