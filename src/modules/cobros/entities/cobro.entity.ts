import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Cliente } from '../../clientes/cliente.entity';
import { MedioCobro } from './medio-cobro.entity';
import { CobroAplicacion } from './cobro-aplicacion.entity';

export type EstadoCobro = 'CONFIRMADO' | 'ANULADO';

@Entity('cobro')
@Index(['tenant_id', 'numero'], { unique: true })
export class Cobro extends BaseTenantEntity {
  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'int' })
  numero!: number;

  @Column({ type: 'int' })
  clienteId!: number;

  @ManyToOne(() => Cliente)
  @JoinColumn({ name: 'clienteId' })
  cliente!: Cliente;

  @Column({ type: 'int' })
  medioId!: number;

  @ManyToOne(() => MedioCobro)
  @JoinColumn({ name: 'medioId' })
  medio!: MedioCobro;

  @Column({ type: 'varchar', length: 60, nullable: true })
    comprobante?: string | null;


  @Column({ type: 'numeric', precision: 14, scale: 2 })
  monto!: string;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ type: 'varchar', length: 12, default: 'CONFIRMADO' })
  estado!: EstadoCobro;

  @OneToMany(() => CobroAplicacion, (a) => a.cobro, { cascade: true, eager: true })
  aplicaciones!: CobroAplicacion[];
}
