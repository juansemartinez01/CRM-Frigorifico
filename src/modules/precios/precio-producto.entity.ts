import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseTenantEntity } from '../../common/entities/base-tenant.entity';
import { ListaPrecio } from './lista-precio.entity';
import { Producto } from '../productos/producto.entity';

@Entity('precio_producto')
@Index(['tenant_id', 'listaId', 'productoId', 'vigenciaDesde', 'vigenciaHasta'])
export class PrecioProducto extends BaseTenantEntity {
  @Column()
  listaId!: number;

  @ManyToOne(() => ListaPrecio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'listaId' })
  lista!: ListaPrecio;

  @Column()
  productoId!: number;

  @ManyToOne(() => Producto, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productoId' })
  producto!: Producto;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  precio!: string;

  @Column({ type: 'date' })
  vigenciaDesde!: string; // YYYY-MM-DD

  @Column({ type: 'date', nullable: true })
  vigenciaHasta?: string | null; // null = abierta

  @Column({ default: true })
  activo!: boolean;
}
