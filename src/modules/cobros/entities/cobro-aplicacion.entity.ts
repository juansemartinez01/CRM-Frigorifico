import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { Cobro } from './cobro.entity';
import { RemitoVenta } from '../../remitos/entities/remito-venta.entity';

@Entity('cobro_aplicacion')
export class CobroAplicacion extends BaseTenantEntity {
  @Column({ type: 'int' })
  cobroId!: number;

  @ManyToOne(() => Cobro, (c) => c.aplicaciones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cobroId' })
  cobro!: Cobro;

  @Column({ type: 'int' })
  remitoId!: number;

  @ManyToOne(() => RemitoVenta, { eager: true })
  @JoinColumn({ name: 'remitoId' })
  remito!: RemitoVenta;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  monto!: string;
}
