import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { FileLogger } from './common/logger/file-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: new FileLogger() });
  // maxAge lets the browser cache the CORS preflight (OPTIONS) response —
  // without it, every single request pays a separate ~250-300ms round trip
  // just to re-confirm the same CORS permissions the browser already has.
  app.enableCors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000', maxAge: 86400 });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
