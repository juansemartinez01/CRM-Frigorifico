import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Producto } from './producto.entity';
import { Unidad } from '../unidades/unidad.entity';
import { ProductosService } from './productos.service';
import { ProductosController } from './productos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Producto, Unidad])],
  providers: [ProductosService],
  controllers: [ProductosController],
  exports: [TypeOrmModule, ProductosService],
})
export class ProductosModule {}
