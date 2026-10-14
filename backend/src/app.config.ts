import { INestApplication, ValidationPipe } from '@nestjs/common';
import { json, NextFunction, Request, Response } from 'express';

import { HttpExceptionFilter } from './common/errors/http-exception.filter';

export function configurarApi(app: INestApplication): void {
  const lerJson = json();
  app.use((pedido: Request, resposta: Response, proximo: NextFunction) => {
    if (['POST', 'PUT', 'PATCH'].includes(pedido.method)) {
      lerJson(pedido, resposta, proximo);
    } else {
      proximo();
    }
  });
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({ transform: false, whitelist: false, forbidNonWhitelisted: false }),
  );
}
