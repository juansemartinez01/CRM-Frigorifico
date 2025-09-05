import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportacionesController } from './importaciones.controller';
import { ImportacionesService } from './importaciones.service';
import { ImportMap } from './entities/import-map.entity';

import { Cliente } from '../clientes/cliente.entity';
import { Unidad } from '../unidades/unidad.entity';
import { Producto } from '../productos/producto.entity';
import { RemitosModule } from '../remitos/remitos.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImportMap, Cliente, Unidad, Producto]),
    RemitosModule,
  ],
  controllers: [ImportacionesController],
  providers: [ImportacionesService],
})
export class ImportacionesModule {}
