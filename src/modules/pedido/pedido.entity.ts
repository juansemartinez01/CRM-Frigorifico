import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '@app/common/entities/tenant-base.entity';
import { Cliente } from '@app/modules/cliente/cliente.entity';

@Entity('pedido')
@Index('ix_pedido_tenant', ['tenantId'])
@Index('ix_pedido_cliente', ['clienteId'])
export class Pedido extends TenantBaseEntity {
  @ManyToOne(() => Cliente, { eager: true, nullable: false })
  @JoinColumn({ name: 'cliente_id' })
  cliente!: Cliente;

  @Column({ name: 'cliente_id', type: 'uuid', nullable: false })
  clienteId!: string;

  @Column({ name: 'fecha_remito', type: 'date', nullable: false })
  fechaRemito!: string;

  @Column({
    name: 'numero_remito',
    type: 'varchar',
    length: 50,
    nullable: false,
  })
  numeroRemito!: string;

  @Column({ type: 'varchar', length: 200, nullable: false })
  articulo!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: false })
  cantidad!: string;

  @Column({ type: 'numeric', precision: 12, scale: 3, nullable: false })
  kg!: string;

  @Column({ type: 'text', nullable: true })
  observaciones?: string | null;

  @Column({
    name: 'precio_unitario',
    type: 'numeric',
    precision: 12,
    scale: 2,
    nullable: true,
  })
  precioUnitario?: string | null;

  @Column({
    name: 'precio_total',
    type: 'numeric',
    precision: 14,
    scale: 2,
    nullable: true,
  })
  precioTotal?: string | null;
}
