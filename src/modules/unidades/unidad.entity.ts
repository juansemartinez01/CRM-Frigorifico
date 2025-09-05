import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../common/entities/base-tenant.entity';

@Entity('unidad')
@Index(['tenant_id', 'nombre'], { unique: true })
export class Unidad extends BaseTenantEntity {
  @Column({ length: 50 })
  nombre!: string; // Kilogramo, Unidad, Caja

  @Column({ length: 10, nullable: true })
  simbolo?: string; // kg, u, cj
}
