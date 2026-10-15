import { INestApplication, ValidationPipe } from '@nestjs/common';
import { json, NextFunction, Request, Response } from 'express';

import { HttpExceptionFilter } from './common/errors/http-exception.filter';
import { createHttpLogger } from './common/logging/http-logging.middleware';

export function configureApi(app: INestApplication): void {
  app.use(createHttpLogger());
  const parseJson = json();
  app.use((request: Request, response: Response, next: NextFunction) => {
    const bodylessSale =
      request.method === 'POST' && /^\/api\/v1\/players\/[^/]+\/sell\/?$/.test(request.path);
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && !bodylessSale) {
      parseJson(request, response, next);
    } else {
      next();
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
