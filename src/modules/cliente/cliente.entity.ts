import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { TenantBaseEntity } from '@app/common/entities/tenant-base.entity';
import { RazonSocial } from '@app/modules/razon-social/razon-social.entity';
import { Revendedor } from '@app/modules/revendedor/revendedor.entity';

@Entity('cliente')
@Unique('ux_cliente_tenant_cuit', ['tenantId', 'cuit'])
@Index('ix_cliente_tenant', ['tenantId'])
export class Cliente extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 20, nullable: false })
  cuit!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  nombre?: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  apellido?: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono?: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  email?: string | null;

  @ManyToOne(() => RazonSocial, { eager: true, nullable: false })
  @JoinColumn({ name: 'razon_social_id' })
  razonSocial!: RazonSocial;

  @Column({ name: 'razon_social_id', type: 'uuid', nullable: false })
  razonSocialId!: string;

  @ManyToOne(() => Revendedor, { eager: true, nullable: true })
  @JoinColumn({ name: 'revendedor_id' })
  revendedor?: Revendedor | null;

  @Column({ name: 'revendedor_id', type: 'uuid', nullable: true })
  revendedorId?: string | null;
}
