import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ListaPrecio } from './lista-precio.entity';
import { PrecioProducto } from './precio-producto.entity';
import { ListasPrecioService } from './listas-precio.service';
import { PreciosService } from './precios.service';
import { ListasPrecioController } from './listas-precio.controller';
import { PreciosController } from './precios.controller';
import { Cliente } from '../clientes/cliente.entity';
import { Producto } from '../productos/producto.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ListaPrecio, PrecioProducto, Cliente, Producto])],
  providers: [ListasPrecioService, PreciosService],
  controllers: [ListasPrecioController, PreciosController],
  exports: [TypeOrmModule],
})
export class PreciosModule {}
