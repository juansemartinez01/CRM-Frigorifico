import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cliente } from './cliente.entity';
import { ClienteService } from './cliente.service';
import { ClienteController } from './cliente.controller';
import { CuentaCorriente } from '../cuenta-corriente/cuenta-corriente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cliente,CuentaCorriente])],
  providers: [ClienteService],
  controllers: [ClienteController],
  exports: [TypeOrmModule, ClienteService],
})
export class ClienteModule {}
