import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Cliente } from '../../clientes/cliente.entity';

export type TipoAjuste = 'DEBE' | 'HABER';
export type MotivoAjuste = 'BONIFICACION' | 'REDONDEO' | 'INTERES' | 'CORRECCION' | 'OTRO';
export type EstadoAjuste = 'CONFIRMADO' | 'ANULADO';

@Entity('ajuste_cc')
@Index(['tenant_id', 'numero'], { unique: true }) // numeración por tenant
export class AjusteCC extends BaseTenantEntity {
  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'int' })
  numero!: number;

  @Column({ type: 'int' })
  clienteId!: number;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'clienteId' })
  cliente!: Cliente;

  @Column({ type: 'varchar', length: 8 })
  tipo!: TipoAjuste; // DEBE/HABER

  @Column({ type: 'varchar', length: 20 })
  motivo!: MotivoAjuste;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  monto!: string;

  @Column({ type: 'text', nullable: true })
  observaciones?: string | null;

  @Column({ type: 'varchar', length: 12, default: 'CONFIRMADO' })
  estado!: EstadoAjuste;
}
