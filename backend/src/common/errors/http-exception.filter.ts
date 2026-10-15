import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { BusinessRuleError } from './business-rule.error';
import { InvalidInputError } from './invalid-input.error';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof InvalidInputError
        ? HttpStatus.BAD_REQUEST
        : exception instanceof BusinessRuleError
          ? HttpStatus.CONFLICT
          : exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;
    const message = this.extractMessage(exception);

    response.status(status).json({ message });
  }

  private extractMessage(exception: unknown): string {
    if (exception instanceof BusinessRuleError || exception instanceof InvalidInputError) {
      return exception.message;
    }
    if (!(exception instanceof HttpException)) {
      return 'Erro interno do servidor.';
    }

    const body = exception.getResponse();
    if (typeof body === 'string') {
      return body;
    }

    if (typeof body === 'object' && body !== null && 'message' in body) {
      const message = body.message;
      return Array.isArray(message) ? message[0] : String(message);
    }

    return 'Requisição inválida.';
  }
}
