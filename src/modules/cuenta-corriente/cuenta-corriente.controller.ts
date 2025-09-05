import { Controller, Get, Param, Query } from '@nestjs/common';
import { CuentaCorrienteService } from './cuenta-corriente.service';
import { QuerySaldosDto } from './dto/query-saldos.dto';
import { QueryExtractoDto } from './dto/query-extracto.dto';

@Controller('cuentas-corriente')
export class CuentaCorrienteController {
  constructor(private readonly service: CuentaCorrienteService) {}

  // GET /cuentas-corriente/saldos?q=&filtro=&orderBy=&order=&page=&limit=
  @Get('saldos')
  saldos(@Query() q: QuerySaldosDto) {
    return this.service.saldos(q);
  }

  // GET /cuentas-corriente/:clienteId/saldo
  @Get(':clienteId/saldo')
  saldoCliente(@Param('clienteId') clienteId: string) {
    return this.service.saldoCliente(Number(clienteId));
  }

  // GET /cuentas-corriente/:clienteId/extracto?desde=&hasta=&order=&page=&limit=
  @Get(':clienteId/extracto')
  extracto(@Param('clienteId') clienteId: string, @Query() q: QueryExtractoDto) {
    return this.service.extracto(Number(clienteId), q);
  }

  // GET /cuentas-corriente/:clienteId/remitos-abiertos
  @Get(':clienteId/remitos-abiertos')
  remitosAbiertos(@Param('clienteId') clienteId: string) {
    return this.service.remitosAbiertos(Number(clienteId));
  }
}
