import { Column, Entity, OneToMany } from 'typeorm';
import { BaseTenantEntity } from '../../common/entities/base-tenant.entity';
import { User } from '../users/user.entity';

@Entity('tenant')
export class Tenant extends BaseTenantEntity {
  @Column({ length: 150 })
  nombre!: string;

  @Column({ length: 20, nullable: true })
  cuit?: string;

  @OneToMany(() => User, u => u.tenant)
  usuarios!: User[];
}
