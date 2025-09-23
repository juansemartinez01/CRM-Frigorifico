import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PedidoImportController } from './pedido-import.controller';
import { PedidoImportService } from './pedido-import.service';
import { RazonSocial } from '@app/modules/razon-social/razon-social.entity';
import { Revendedor } from '@app/modules/revendedor/revendedor.entity';
import { Cliente } from '@app/modules/cliente/cliente.entity';
import { Pedido } from '@app/modules/pedido/pedido.entity';
import { CuentaCorrienteModule } from '@app/modules/cuenta-corriente/cuenta-corriente.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RazonSocial, Revendedor, Cliente, Pedido]),
    forwardRef(() => CuentaCorrienteModule), // por si más adelante ajustamos saldo automáticamente
  ],
  controllers: [PedidoImportController],
  providers: [PedidoImportService],
  exports: [PedidoImportService],
})
export class PedidoImportModule {}
