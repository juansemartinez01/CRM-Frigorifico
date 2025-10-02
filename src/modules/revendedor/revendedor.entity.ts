import { Entity, Column, Index, Unique } from 'typeorm';
import { TenantBaseEntity } from '@app/common/entities/tenant-base.entity';

@Entity('revendedor')
@Unique('ux_revendedor_tenant_cuit', ['tenantId', 'cuit'])
@Index('ix_revendedor_tenant', ['tenantId'])
export class Revendedor extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 20, nullable: false })
  cuit!: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  nombre?: string | null;
}
