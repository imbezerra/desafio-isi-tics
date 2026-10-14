import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { RegraNegocioError } from './regra-negocio.error';
import { EntradaInvalidaError } from './entrada-invalida.error';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof EntradaInvalidaError
        ? HttpStatus.BAD_REQUEST
        : exception instanceof RegraNegocioError
          ? HttpStatus.CONFLICT
          : exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.extrairMensagem(exception);

    response.status(status).json({ message });
  }

  private extrairMensagem(exception: unknown): string {
    if (exception instanceof RegraNegocioError || exception instanceof EntradaInvalidaError) {
      return exception.message;
    }
    if (!(exception instanceof HttpException)) {
      return 'Erro interno do servidor.';
    }

    const corpo = exception.getResponse();
    if (typeof corpo === 'string') {
      return corpo;
    }

    if (typeof corpo === 'object' && corpo !== null && 'message' in corpo) {
      const mensagem = corpo.message;
      return Array.isArray(mensagem) ? mensagem[0] : String(mensagem);
    }

    return 'Requisição inválida.';
  }
}
