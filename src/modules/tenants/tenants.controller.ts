import { Body, Controller, Get, Post } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Controller('tenants')
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Post()
  create(@Body() dto: CreateTenantDto) {
    // Permite bootstrapear creando una empresa; para operar luego, usar header X-Tenant-Id
    return this.service.create(dto);
  }

  @Get()
  list() {
    return this.service.findAll();
  }
}
