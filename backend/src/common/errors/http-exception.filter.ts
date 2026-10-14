import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.extrairMensagem(exception);

    response.status(status).json({ message });
  }

  private extrairMensagem(exception: unknown): string {
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
