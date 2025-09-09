import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';


async function bootstrap() {
  dotenv.config();
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const port = process.env.PORT || 3000;
  await app.listen(port as number);
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`);
}
bootstrap();
