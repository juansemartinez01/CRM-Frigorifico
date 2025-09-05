import { Controller, Get, Query } from '@nestjs/common';
import { ReportesService } from './reportes.service';
import { LibroQueryDto } from './dto/libro-query.dto';
import { RequestContext } from '../../common/request-context';

@Controller('reportes')
export class ReportesController {
  constructor(private readonly service: ReportesService) {}

  @Get('libro')
  async libro(@Query() q: LibroQueryDto) {
    // Garantizamos contexto tenant
    if (!RequestContext.tenantId()) {
      // si tu middleware ya valida, esto nunca se ejecuta
      throw new Error('Falta X-Tenant-Id');
    }
    return this.service.libro(q);
  }
}
