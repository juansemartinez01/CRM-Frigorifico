import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseTenantEntity } from '../../common/entities/base-tenant.entity';
import { Cliente } from '../clientes/cliente.entity';

export type TipoLista = 'GENERAL' | 'CLIENTE';

@Entity('lista_precio')
@Index(['tenant_id', 'nombre'], { unique: true })
export class ListaPrecio extends BaseTenantEntity {
  @Column({ length: 120 })
  nombre!: string;

  @Column({ type: 'varchar', length: 20, default: 'GENERAL' })
  tipo!: TipoLista; // GENERAL | CLIENTE

  @Column({ type: 'int', nullable: true })
  clienteId?: number | null;

  @ManyToOne(() => Cliente, { nullable: true })
  @JoinColumn({ name: 'clienteId' })
  cliente?: Cliente | null;

  @Column({ length: 10, default: 'ARS' })
  moneda!: string;

  @Column({ type: 'text', nullable: true })
  notas?: string;

  @Column({ default: true })
  activo!: boolean;
}
