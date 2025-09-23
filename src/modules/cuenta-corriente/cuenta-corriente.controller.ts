import { Controller, Get, Param } from '@nestjs/common';
import { CuentaCorrienteService } from './cuenta-corriente.service';

@Controller('cuentas-corrientes')
export class CuentaCorrienteController {
  constructor(private readonly service: CuentaCorrienteService) {}

  @Get(':clienteId')
  getByCliente(@Param('clienteId') clienteId: string) {
    return this.service.getByCliente(clienteId);
  }
}
