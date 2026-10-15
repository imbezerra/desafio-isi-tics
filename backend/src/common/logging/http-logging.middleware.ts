import { Logger } from '@nestjs/common';
import { RequestHandler } from 'express';

import { formatBrasiliaDateTime } from '../parsers/date.parser';

export function createHttpLogger(): RequestHandler {
  const logger = new Logger('HTTP');

  return (request, response, next) => {
    response.once('finish', () => {
      logger.log(
        `${formatBrasiliaDateTime(new Date())} ${request.method} ${request.path} ${response.statusCode}`,
      );
    });
    next();
  };
}
