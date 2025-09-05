import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

@Entity('import_map')
@Index(['tenant_id', 'source', 'external_id'], { unique: true })
export class ImportMap extends BaseTenantEntity {
  @Column({ type: 'varchar', length: 80 })
  source!: string; // p.ej. "Detalle Remitos"

  @Column({ type: 'varchar', length: 160 })
  external_id!: string; // clave externa única (remito|cuit|fecha)

  @Column({ type: 'varchar', length: 40 })
  entity!: string; // p.ej. "REMITO"

  @Column({ type: 'int' })
  entityId!: number;

  @Column({ type: 'jsonb', nullable: true })
  raw?: any;
}
