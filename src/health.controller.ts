import { Controller, Get } from '@nestjs/common';
import { RequestContext } from './common/request-context';

@Controller('health')
export class HealthController {
  @Get()
  ping() {
    return { ok: true, tenantId: RequestContext.tenantId() ?? null };
  }
}
