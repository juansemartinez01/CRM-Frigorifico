import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, Column } from 'typeorm';
import { User } from '../users/user.entity';
import { Role } from './role.entity';

@Entity('user_role')
@Unique(['user_id', 'role_id'])
export class UserRole {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  user_id!: number;

  @Column()
  role_id!: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @ManyToOne(() => Role, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role!: Role;
}
