import { Controller, Get, Param, Query } from '@nestjs/common';
import { CuentaCorrienteService } from './cuenta-corriente.service';
import { BuscarCuentaCorrienteDto } from './dto/buscar-cuenta-corriente.dto';

@Controller('cuentas-corrientes')
export class CuentaCorrienteController {
  constructor(private readonly service: CuentaCorrienteService) {}

  @Get(':clienteId')
  getByCliente(@Param('clienteId') clienteId: string) {
    return this.service.getByCliente(clienteId);
  }

  @Get()
  search(@Query() filtros: BuscarCuentaCorrienteDto) {
    return this.service.searchAll(filtros);
  }
}
