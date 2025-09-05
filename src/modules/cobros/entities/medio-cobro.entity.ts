import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';

export type TipoMedio = 'EFECTIVO' | 'TRANSFERENCIA' | 'CHEQUE' | 'TARJETA' | 'OTRO';

@Entity('medio_cobro')
@Index(['tenant_id', 'nombre'], { unique: true })
export class MedioCobro extends BaseTenantEntity {
  @Column({ length: 60 })
  nombre!: string;

  @Column({ type: 'varchar', length: 20, default: 'OTRO' })
  tipo!: TipoMedio;

  @Column({ default: true })
  activo!: boolean;
}
