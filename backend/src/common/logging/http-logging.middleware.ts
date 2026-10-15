import { Logger } from '@nestjs/common';
import { RequestHandler } from 'express';

import { formatarDataHoraBrasilia } from '../parsers/date.parser';

export function criarRegistroHttp(): RequestHandler {
  const logger = new Logger('HTTP');

  return (pedido, resposta, proximo) => {
    resposta.once('finish', () => {
      logger.log(
        `${formatarDataHoraBrasilia(new Date())} ${pedido.method} ${pedido.path} ${resposta.statusCode}`,
      );
    });
    proximo();
  };
}
