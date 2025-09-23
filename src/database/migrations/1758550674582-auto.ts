import { MigrationInterface, QueryRunner } from "typeorm";

export class Auto1758550674582 implements MigrationInterface {
    name = 'Auto1758550674582'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "revendedor" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "cuit" character varying(20) NOT NULL, CONSTRAINT "ux_revendedor_tenant_cuit" UNIQUE ("tenant_id", "cuit"), CONSTRAINT "PK_9ca07f3849964ae04579ce78184" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_revendedor_tenant" ON "revendedor" ("tenant_id") `);
        await queryRunner.query(`CREATE TABLE "razon_social" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "cuit" character varying(20) NOT NULL, CONSTRAINT "ux_razon_social_tenant_cuit" UNIQUE ("tenant_id", "cuit"), CONSTRAINT "PK_875a761be382f6be8ae475c0047" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_razon_social_tenant" ON "razon_social" ("tenant_id") `);
        await queryRunner.query(`CREATE TABLE "cliente" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "cuit" character varying(20) NOT NULL, "razon_social_id" uuid NOT NULL, "revendedor_id" uuid, CONSTRAINT "ux_cliente_tenant_cuit" UNIQUE ("tenant_id", "cuit"), CONSTRAINT "PK_18990e8df6cf7fe71b9dc0f5f39" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_cliente_tenant" ON "cliente" ("tenant_id") `);
        await queryRunner.query(`CREATE TABLE "pedido" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "cliente_id" uuid NOT NULL, "fecha_remito" date NOT NULL, "numero_remito" character varying(50) NOT NULL, "articulo" character varying(200) NOT NULL, "cantidad" numeric(12,2) NOT NULL, "kg" numeric(12,3) NOT NULL, "observaciones" text, CONSTRAINT "PK_af8d8b3d07fae559c37f56b3f43" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_pedido_cliente" ON "pedido" ("cliente_id") `);
        await queryRunner.query(`CREATE INDEX "ix_pedido_tenant" ON "pedido" ("tenant_id") `);
        await queryRunner.query(`CREATE TABLE "movimiento_cta_cte" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "cliente_id" uuid NOT NULL, "tipo" character varying(10) NOT NULL, "fecha" date NOT NULL, "monto" numeric(14,2) NOT NULL, CONSTRAINT "PK_d913809d717512c6c1a685009bc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_mov_cliente" ON "movimiento_cta_cte" ("cliente_id") `);
        await queryRunner.query(`CREATE INDEX "ix_mov_tenant" ON "movimiento_cta_cte" ("tenant_id") `);
        await queryRunner.query(`CREATE TABLE "cuenta_corriente" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenant_id" character varying(100) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "cliente_id" uuid NOT NULL, "saldo" numeric(14,2) NOT NULL DEFAULT '0', CONSTRAINT "ux_ctacte_tenant_cliente" UNIQUE ("tenant_id", "cliente_id"), CONSTRAINT "PK_3812e646eafdee728526c6d9911" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "ix_ctacte_tenant" ON "cuenta_corriente" ("tenant_id") `);
        await queryRunner.query(`ALTER TABLE "cliente" ADD CONSTRAINT "FK_811e1a319a9fd895a401823af5e" FOREIGN KEY ("razon_social_id") REFERENCES "razon_social"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cliente" ADD CONSTRAINT "FK_6cecd69139dd637409de8cdd1ac" FOREIGN KEY ("revendedor_id") REFERENCES "revendedor"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pedido" ADD CONSTRAINT "FK_ab19fb380d17682f87649eded89" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "movimiento_cta_cte" ADD CONSTRAINT "FK_fb4b964051217a71079236d71a7" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cuenta_corriente" ADD CONSTRAINT "FK_a7992c55815c4e911af9c79c325" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cuenta_corriente" DROP CONSTRAINT "FK_a7992c55815c4e911af9c79c325"`);
        await queryRunner.query(`ALTER TABLE "movimiento_cta_cte" DROP CONSTRAINT "FK_fb4b964051217a71079236d71a7"`);
        await queryRunner.query(`ALTER TABLE "pedido" DROP CONSTRAINT "FK_ab19fb380d17682f87649eded89"`);
        await queryRunner.query(`ALTER TABLE "cliente" DROP CONSTRAINT "FK_6cecd69139dd637409de8cdd1ac"`);
        await queryRunner.query(`ALTER TABLE "cliente" DROP CONSTRAINT "FK_811e1a319a9fd895a401823af5e"`);
        await queryRunner.query(`DROP INDEX "public"."ix_ctacte_tenant"`);
        await queryRunner.query(`DROP TABLE "cuenta_corriente"`);
        await queryRunner.query(`DROP INDEX "public"."ix_mov_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."ix_mov_cliente"`);
        await queryRunner.query(`DROP TABLE "movimiento_cta_cte"`);
        await queryRunner.query(`DROP INDEX "public"."ix_pedido_tenant"`);
        await queryRunner.query(`DROP INDEX "public"."ix_pedido_cliente"`);
        await queryRunner.query(`DROP TABLE "pedido"`);
        await queryRunner.query(`DROP INDEX "public"."ix_cliente_tenant"`);
        await queryRunner.query(`DROP TABLE "cliente"`);
        await queryRunner.query(`DROP INDEX "public"."ix_razon_social_tenant"`);
        await queryRunner.query(`DROP TABLE "razon_social"`);
        await queryRunner.query(`DROP INDEX "public"."ix_revendedor_tenant"`);
        await queryRunner.query(`DROP TABLE "revendedor"`);
    }

}
