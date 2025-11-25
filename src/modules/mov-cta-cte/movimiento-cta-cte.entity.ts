import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { TenantBaseEntity } from '@app/common/entities/tenant-base.entity';
import { Cliente } from '@app/modules/cliente/cliente.entity';
import { Pedido } from '../pedido/pedido.entity';

export type TipoMovimiento = 'VENTA' | 'COBRO';




@Entity('movimiento_cta_cte')
@Index('ux_mov_tenant_tipo_pedido', ['tenantId', 'tipo', 'pedidoId'], {
  unique: true,
  where: `"pedido_id" IS NOT NULL`,
})
@Index('ix_mov_tenant', ['tenantId'])
@Index('ix_mov_cliente', ['clienteId'])
export class MovimientoCuentaCorriente extends TenantBaseEntity {
  @ManyToOne(() => Cliente, { eager: true, nullable: false })
  @JoinColumn({ name: 'cliente_id' })
  cliente!: Cliente;

  @Column({ name: 'cliente_id', type: 'uuid', nullable: false })
  clienteId!: string;

  @Column({ type: 'varchar', length: 10, nullable: false })
  tipo!: TipoMovimiento;

  @Column({ type: 'date', nullable: false })
  fecha!: string; // YYYY-MM-DD

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: false })
  monto!: string;

  @ManyToOne(() => Pedido, { nullable: true })
  @JoinColumn({ name: 'pedido_id' })
  pedido?: Pedido | null;

  @Column({ name: 'pedido_id', type: 'uuid', nullable: true })
  pedidoId?: string | null;

  @Column({ type: 'text', nullable: true })
  nota?: string | null;
}
