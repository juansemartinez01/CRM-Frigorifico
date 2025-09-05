import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  Unique,
} from 'typeorm';
import { BaseTenantEntity } from '../../common/entities/base-tenant.entity';
import { Tenant } from '../tenants/tenant.entity';
import { Role } from '../roles/role.entity';

@Entity('user')
@Unique(['email', 'tenant_id'])
export class User extends BaseTenantEntity {
  @Column({ length: 120 })
  nombre!: string;

  @Column({ length: 150 })
  email!: string;

  @Column()
  password_hash!: string;

  @ManyToOne(() => Tenant, (t) => t.usuarios, { onDelete: 'CASCADE' })
  tenant!: Tenant;

  @ManyToMany(() => Role, (r) => r.usuarios, { cascade: true })
  @JoinTable({
    name: 'user_role',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles!: Role[];
}
