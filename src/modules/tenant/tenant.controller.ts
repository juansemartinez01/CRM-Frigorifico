import { Body, Controller, Post } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { Public } from '@app/auth/public.decorator';

@Controller('tenants')
export class TenantController {
  constructor(private readonly service: TenantService) {}

  @Public() // quítalo en prod si querés que sólo admin cree tenants
  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.service.create(dto);
  }
}
