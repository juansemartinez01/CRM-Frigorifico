import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Revendedor } from './revendedor.entity';
import { RevendedorService } from './revendedor.service';
import { RevendedorController } from './revendedor.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Revendedor])],
  providers: [RevendedorService],
  controllers: [RevendedorController],
  exports: [TypeOrmModule, RevendedorService],
})
export class RevendedorModule {}
