// src/modules/movimientos/movimiento-cc.entity.ts
import { Column, Entity, Index } from 'typeorm';
import { BaseTenantEntity } from '../../common/entities/base-tenant.entity';

export type TipoMovimiento = 'DEBE' | 'HABER';
export type OrigenMovimiento = 'REMITO' | 'COBRO' | 'AJUSTE';

@Entity('mov_cc_cliente')
@Index(['tenant_id', 'clienteId', 'fecha'])
@Index(['tenant_id', 'origen', 'referenciaId']) // acelera los joins por referencia
export class MovimientoCC extends BaseTenantEntity {
  @Column({ name: 'clienteId', type: 'int' })
  clienteId!: number;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'varchar', length: 8 })
  tipo!: TipoMovimiento; // DEBE / HABER

  @Column({ type: 'varchar', length: 12 })
  origen!: OrigenMovimiento; // REMITO / COBRO / AJUSTE

  // En Postgres NUMERIC se mapea a string en TypeORM para precisión exacta
  @Column({ type: 'numeric', precision: 14, scale: 2 })
  monto!: string;

  @Column({ name: 'referenciaId', type: 'int', nullable: true })
  referenciaId?: number | null;

  @Column({ type: 'text', nullable: true })
  observaciones?: string | null;
}
