import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPedidoDedupeIndex1699999999999 implements MigrationInterface {
  name = 'AddPedidoDedupeIndex1699999999999';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Si ya tenés duplicados, esta CTE borra los repetidos y deja el más viejo
    await queryRunner.query(`
      WITH ranked AS (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY tenant_id, fecha_remito, numero_remito, articulo, cantidad, kg
                 ORDER BY created_at ASC, id ASC
               ) AS rn
        FROM pedido
      )
      DELETE FROM pedido p
      USING ranked r
      WHERE p.id = r.id AND r.rn > 1;
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS ux_pedido_dedupe
      ON pedido (tenant_id, fecha_remito, numero_remito, articulo, cantidad, kg);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS ux_pedido_dedupe;`);
  }
}
