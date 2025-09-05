import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from './role.entity';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(@InjectRepository(Role) private repo: Repository<Role>) {}

  async onModuleInit() {
    // Seed mínimo
    const wanted = ['admin', 'manager', 'vendedor'];
    const exist = await this.repo.find({ where: { nombre: In(wanted) } });
    const missing = wanted.filter(n => !exist.some(r => r.nombre === n));
    if (missing.length) {
      await this.repo.save(missing.map(nombre => this.repo.create({ nombre })));
    }
  }

  async findByNames(names: string[]) {
    return this.repo.find({ where: { nombre: In(names) } });
  }
}
