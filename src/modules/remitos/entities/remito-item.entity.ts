import { Check, Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseTenantEntity } from '../../../common/entities/base-tenant.entity';
import { RemitoVenta } from './remito-venta.entity';
import { Producto } from '../../productos/producto.entity';



@Check('CHK_remito_item_cant_pos',  'cantidad::numeric >= 0')
@Check('CHK_remito_item_prec_pos',  'precio::numeric  >= 0')
@Entity('remito_item')
export class RemitoItem extends BaseTenantEntity {
  @Column()
  remitoId!: number;

  @ManyToOne(() => RemitoVenta, (r) => r.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'remitoId' })
  remito!: RemitoVenta;

  @Column()
  productoId!: number;

  @ManyToOne(() => Producto, { eager: true })
  @JoinColumn({ name: 'productoId' })
  producto!: Producto;

  @Column({ length: 120 })
  descripcion!: string; // copia del nombre/corte del producto (editable)

  @Column({ type: 'numeric', precision: 14, scale: 3 })
  cantidad!: string; // kg (3 decimales)

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  precio!: string; // precio unitario

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  subtotal!: string; // cantidad * precio
}
