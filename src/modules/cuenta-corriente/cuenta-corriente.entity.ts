import { Entity, Column, ManyToOne, JoinColumn, Unique, Index } from 'typeorm';
import { TenantBaseEntity } from '@app/common/entities/tenant-base.entity';
import { Cliente } from '@app/modules/cliente/cliente.entity';

@Entity('cuenta_corriente')
@Unique('ux_ctacte_tenant_cliente', ['tenantId', 'clienteId'])
@Index('ix_ctacte_tenant', ['tenantId'])
export class CuentaCorriente extends TenantBaseEntity {
  @ManyToOne(() => Cliente, { eager: true, nullable: false })
  @JoinColumn({ name: 'cliente_id' })
  cliente!: Cliente;

  @Column({ name: 'cliente_id', type: 'uuid', nullable: false })
  clienteId!: string;

  // Saldo (deuda). VENTA aumenta, COBRO disminuye
  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  saldo!: string;
}
