import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { RazonSocial } from '@app/modules/razon-social/razon-social.entity';
import { Cliente } from '@app/modules/cliente/cliente.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant) private tRepo: Repository<Tenant>,
    @InjectRepository(RazonSocial) private rsRepo: Repository<RazonSocial>,
    @InjectRepository(Cliente) private cRepo: Repository<Cliente>,
    private ds: DataSource,
  ) {}

  async create(dto: CreateTenantDto) {
    const id = dto.id.trim().toLowerCase();
    const exists = await this.tRepo.findOne({ where: { id } });
    if (exists) throw new BadRequestException('Tenant ya existe');

    return this.ds.transaction(async (m) => {
      const t = m
        .getRepository(Tenant)
        .create({ id, name: dto.name, isActive: true });
      const saved = await m.getRepository(Tenant).save(t);

      // sembrar RS/Clientes especiales
      await this.seedDefaults(id, m);

      return saved;
    });
  }

  private async ensureRazonSocial(tenantId: string, cuit: string, m = this.ds.manager) {
    const repo = m.getRepository(RazonSocial);
    let rs = await repo.findOne({ where: { tenantId, cuit } });
    if (!rs) {
      rs = repo.create({ tenantId, cuit });
      rs = await repo.save(rs);
    }
    return rs;
  }

  private async ensureCliente(
    tenantId: string,
    cuit: string,
    rsCuit: string,
    m = this.ds.manager,
  ) {
    const repo = m.getRepository(Cliente);
    let c = await repo.findOne({ where: { tenantId, cuit } });
    if (!c) {
      const rs = await this.ensureRazonSocial(tenantId, rsCuit, m);
      c = repo.create({
        tenantId,
        cuit,
        razonSocialId: rs.id,
        revendedorId: null,
      });
      c = await repo.save(c);
    }
    return c;
  }

  /** crea "Temporal" (00-...) y "No registrado" (99-...) */
  private async seedDefaults(tenantId: string, m = this.ds.manager) {
    await this.ensureCliente(tenantId, '00-00000000-1', '00-00000000-1', m); // Temporal
    await this.ensureCliente(tenantId, '99-99999999-9', '99-99999999-9', m); // No registrado
  }
}
