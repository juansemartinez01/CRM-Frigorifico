import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Cliente } from '../../clientes/cliente.entity';
import { User } from '../../users/user.entity';
import { RemitoItem } from './remito-item.entity';

export type EstadoRemito = 'CONFIRMADO' | 'ANULADO';

@Entity('remito_venta')
@Index(['tenant_id', 'numero'], { unique: true })
export class RemitoVenta extends BaseTenantEntity {
  @Column({ type: 'date' })
  fecha!: string; // YYYY-MM-DD

  @Column({ type: 'int' })
  numero!: number; // numeración secuencial por tenant

  @Column()
  clienteId!: number;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'clienteId' })
  cliente!: Cliente;

  @Column({ nullable: true })
  usuarioId?: number | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usuarioId' })
  usuario?: User | null;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  subtotal!: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total!: string;

  @Column({ type: 'varchar', length: 12, default: 'CONFIRMADO' })
  estado!: EstadoRemito;

  @OneToMany(() => RemitoItem, (i) => i.remito, { cascade: true, eager: true })
  items!: RemitoItem[];
}
