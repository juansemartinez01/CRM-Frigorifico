import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CobrosController } from './cobros.controller';
import { MediosCobroController } from './medios-cobro.controller';
import { CobrosService } from './cobros.service';
import { MediosCobroService } from './medios-cobro.service';
import { Cobro } from './entities/cobro.entity';
import { CobroAplicacion } from './entities/cobro-aplicacion.entity';
import { MedioCobro } from './entities/medio-cobro.entity';
import { Cliente } from '../clientes/cliente.entity';
import { RemitoVenta } from '../remitos/entities/remito-venta.entity';
import { MovimientosModule } from '../movimientos/movimientos.module';

@Module({
  imports: [TypeOrmModule.forFeature([Cobro, CobroAplicacion, MedioCobro, Cliente, RemitoVenta]), MovimientosModule],
  controllers: [CobrosController, MediosCobroController],
  providers: [CobrosService, MediosCobroService],
  exports: [TypeOrmModule],
})
export class CobrosModule {}
