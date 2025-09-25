import { Entity, Column, Unique, Index } from 'typeorm';
import { TenantBaseEntity } from '@app/common/entities/tenant-base.entity';

@Entity('user')
@Unique('ux_user_tenant_email', ['tenantId', 'email'])
@Index('ix_user_tenant', ['tenantId'])
export class User extends TenantBaseEntity {
  @Column({ type: 'varchar', length: 255, nullable: false })
  email!: string;

  @Column({
    name: 'password_hash',
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  name?: string | null;

  // roles: admin | operator | read  (guardamos como simple-array: "admin,operator")
  @Column({ type: 'simple-array', nullable: false, default: 'read' })
  roles!: string[];

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;
}
