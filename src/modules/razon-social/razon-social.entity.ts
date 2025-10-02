import { Entity, Column, Index, Unique } from 'typeorm';
import { TenantBaseEntity } from '@app/common/entities/tenant-base.entity';

@Entity('razon_social')
@Unique('ux_razon_social_tenant_cuit', ['tenantId', 'cuit'])
@Index('ix_razon_social_tenant', ['tenantId'])
export class RazonSocial extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 20, nullable: false })
  cuit!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nombre?: string | null;
}
