import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '@app/common/entities/tenant-base.entity';
import { Pedido } from '@app/modules/pedido/pedido.entity';
import { Cliente } from '@app/modules/cliente/cliente.entity';

@Entity('pedido_resolucion')
@Index('ix_pedido_resolucion_tenant', ['tenantId'])
export class PedidoResolucion extends TenantBaseEntity {
  @ManyToOne(() => Pedido, { eager: true, nullable: false })
  @JoinColumn({ name: 'pedido_id' })
  pedido!: Pedido;

  @Column({ name: 'pedido_id', type: 'uuid', nullable: false })
  pedidoId!: string;

  @ManyToOne(() => Cliente, { eager: true, nullable: false })
  @JoinColumn({ name: 'cliente_anterior_id' })
  clienteAnterior!: Cliente;

  @Column({ name: 'cliente_anterior_id', type: 'uuid', nullable: false })
  clienteAnteriorId!: string;

  @ManyToOne(() => Cliente, { eager: true, nullable: false })
  @JoinColumn({ name: 'cliente_nuevo_id' })
  clienteNuevo!: Cliente;

  @Column({ name: 'cliente_nuevo_id', type: 'uuid', nullable: false })
  clienteNuevoId!: string;

  @Column({ type: 'text', nullable: true })
  motivo?: string | null;

  // Campo libre para identificar quién resolvió (hasta que agreguemos auth)
  @Column({ type: 'varchar', length: 100, nullable: true })
  actor?: string | null;
}
