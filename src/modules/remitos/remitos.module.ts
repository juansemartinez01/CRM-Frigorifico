import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RemitosController } from './remitos.controller';
import { RemitosService } from './remitos.service';
import { RemitoVenta } from './entities/remito-venta.entity';
import { RemitoItem } from './entities/remito-item.entity';
import { MovimientosModule } from '../movimientos/movimientos.module';
import { Producto } from '../productos/producto.entity';
import { Cliente } from '../clientes/cliente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RemitoVenta, RemitoItem, Producto, Cliente]), MovimientosModule],
  controllers: [RemitosController],
  providers: [RemitosService],
  exports: [TypeOrmModule,RemitosService],
  
})
export class RemitosModule {}
