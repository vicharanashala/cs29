import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:5173', 'http://13.235.243.176'],
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3001);
  console.log('Backend running on port ' + (process.env.PORT ?? 3001));
}
bootstrap();
