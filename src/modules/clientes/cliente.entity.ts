import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../common/entities/base-tenant.entity';

@Entity('cliente')
@Index('UQ_cliente_cuit_por_tenant', ['tenant_id', 'cuit'], {
  unique: true,
  where: `"cuit" IS NOT NULL AND "cuit" <> ''`,
})
export class Cliente extends BaseTenantEntity {
  @Column({ type: 'varchar', length: 120, nullable: true })
    nombre!: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  cuit?: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email?: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono?: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion?: string | null;

  @Column({ type: 'text', nullable: true })
  notas?: string | null;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;
}
