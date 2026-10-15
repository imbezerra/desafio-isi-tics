import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { configureApi } from './app.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  configureApi(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Liga de Futebol')
    .setDescription('API REST para administração da liga fictícia de futebol.')
    .setVersion('1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(Number(process.env.PORT ?? 3000));
}

void bootstrap();
