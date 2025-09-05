// src/modules/productos/producto.entity.ts
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseTenantEntity } from '../../common/entities/base-tenant.entity';
import { Unidad } from '../unidades/unidad.entity';

@Entity('producto')
@Index('UQ_producto_nombre_unidad_por_tenant', ['tenant_id', 'nombre', 'unidadId'], { unique: true })
// SKU único solo si está presente (índice parcial)
@Index('UQ_producto_sku_por_tenant_notnull', ['tenant_id', 'sku'], {
  unique: true,
  where: `"sku" IS NOT NULL AND "sku" <> ''`,
})
export class Producto extends BaseTenantEntity {
  @Column({ type: 'varchar', length: 120 })
  nombre!: string;

  // 👇 ahora SKU es opcional
  @Column({ type: 'varchar', length: 60, nullable: true })
  sku?: string | null;

  @Column({ type: 'text', nullable: true })
  descripcion?: string | null;

  @Column({ type: 'int' })
  unidadId!: number;

  @ManyToOne(() => Unidad, { eager: true })
  @JoinColumn({ name: 'unidadId' })
  unidad!: Unidad;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  precioBase?: string | null;

  @Column({ type: 'boolean', default: true })
  activo!: boolean;
}
