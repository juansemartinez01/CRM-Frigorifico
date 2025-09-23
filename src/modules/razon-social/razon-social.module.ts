import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RazonSocial } from './razon-social.entity';
import { RazonSocialService } from './razon-social.service';
import { RazonSocialController } from './razon-social.controller';

@Module({
  imports: [TypeOrmModule.forFeature([RazonSocial])],
  providers: [RazonSocialService],
  controllers: [RazonSocialController],
  exports: [TypeOrmModule, RazonSocialService],
})
export class RazonSocialModule {}
