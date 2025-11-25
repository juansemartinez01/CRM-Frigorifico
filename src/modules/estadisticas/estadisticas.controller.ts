import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { EstadisticasService } from './estadisticas.service';
import { EstadisticasFiltroDto } from './dto/estadisticas-filtro.dto';

@Controller('estadisticas')
export class EstadisticasController {
  constructor(private readonly service: EstadisticasService) {}

  @Get('deuda-por-cliente')
  deudaPorCliente(@Query() f: EstadisticasFiltroDto) {
    this.ensureFechas(f);
    return this.service.deudaPorCliente(f);
  }

  @Get('cortes-monto')
  cortesMonto(@Query() f: EstadisticasFiltroDto) {
    this.ensureFechas(f);
    return this.service.cortesMonto(f);
  }

  @Get('cortes-kg')
  cortesKg(@Query() f: EstadisticasFiltroDto) {
    this.ensureFechas(f);
    return this.service.cortesKg(f);
  }

  @Get('mejor-cliente-por-mes')
  mejorClientePorMes(@Query() f: EstadisticasFiltroDto) {
    this.ensureFechas(f);
    return this.service.mejorClientePorMes(f);
  }

  @Get('resumen')
  async resumen(@Query() f: EstadisticasFiltroDto) {
    this.ensureFechas(f);
    return this.service.resumen(f);
  }

  private ensureFechas(f: EstadisticasFiltroDto) {
    if (!f.fechaDesde || !f.fechaHasta) {
      throw new BadRequestException(
        'Debe enviar fechaDesde y fechaHasta (YYYY-MM-DD).',
      );
    }
    const fd = new Date(f.fechaDesde);
    const fh = new Date(f.fechaHasta);
    if (Number.isNaN(fd.getTime()) || Number.isNaN(fh.getTime())) {
      throw new BadRequestException(
        'fechaDesde/fechaHasta inválidas (YYYY-MM-DD).',
      );
    }
    if (fd > fh) {
      throw new BadRequestException(
        'fechaDesde no puede ser mayor que fechaHasta.',
      );
    }
  }
}
