import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuentaCorrienteService } from './cuenta-corriente.service';
import { CuentaCorrienteController } from './cuenta-corriente.controller';
import { MovimientoCC } from '../movimientos/movimiento.entity';
import { Cliente } from '../clientes/cliente.entity';
import { RemitoVenta } from '../remitos/entities/remito-venta.entity';
import { Cobro } from '../cobros/entities/cobro.entity';
import { CobroAplicacion } from '../cobros/entities/cobro-aplicacion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MovimientoCC, Cliente, RemitoVenta, Cobro, CobroAplicacion])],
  providers: [CuentaCorrienteService],
  controllers: [CuentaCorrienteController],
})
export class CuentaCorrienteModule {}
