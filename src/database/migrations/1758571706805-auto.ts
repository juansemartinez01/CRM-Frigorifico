import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1758571706805 implements MigrationInterface {
    name = 'Auto1758571706805'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."ux_pedido_dedupe"`);
        await queryRunner.query(`CREATE TABLE "pedido_resolucion" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "pedido_id" uuid NOT NULL, "cliente_anterior_id" uuid NOT NULL, "cliente_nuevo_id" uuid NOT NULL, "motivo" text, "actor" character varying(100), CONSTRAINT "PK_66e5a325b676b073de4f7e076fd" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_pedido_resolucion_tenant" ON "pedido_resolucion" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "pedido_resolucion" ADD CONSTRAINT "FK_a8773e431b316268ed356e42a0d" FOREIGN KEY ("pedido_id") REFERENCES "pedido"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pedido_resolucion" ADD CONSTRAINT "FK_dd105e403235014046cf476cfd1" FOREIGN KEY ("cliente_anterior_id") REFERENCES "cliente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pedido_resolucion" ADD CONSTRAINT "FK_441655f16a3146bd4e206d7480a" FOREIGN KEY ("cliente_nuevo_id") REFERENCES "cliente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "pedido_resolucion" DROP CONSTRAINT "FK_441655f16a3146bd4e206d7480a"`);
        await queryRunner.query(`ALTER TABLE "pedido_resolucion" DROP CONSTRAINT "FK_dd105e403235014046cf476cfd1"`);
        await queryRunner.query(`ALTER TABLE "pedido_resolucion" DROP CONSTRAINT "FK_a8773e431b316268ed356e42a0d"`);
        await queryRunner.query(`DROP INDEX "public"."ix_pedido_resolucion_tenant"`);
        await queryRunner.query(`DROP TABLE "pedido_resolucion"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "ux_pedido_dedupe" ON "pedido" ("articulo", "cantidad", "fecha_remito", "kg", "numero_remito", "tenant_id") `);
    }

}
