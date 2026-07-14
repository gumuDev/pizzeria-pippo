import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === 'string'
          ? body
          : Array.isArray((body as { message?: string[] }).message)
            ? (body as { message: string[] }).message.join(', ')
            : ((body as { message?: string }).message ?? exception.message);

      // Forwards extra body fields (e.g. `available` in InsufficientStockException)
      // without touching the { error, code } shape for the rest of the exceptions.
      const extra =
        typeof body === 'object' && body !== null
          ? Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'message' && key !== 'statusCode' && key !== 'error'))
          : {};

      response.status(status).json({ error: message, code: exception.name, ...extra });
      return;
    }

    this.logger.error(exception instanceof Error ? exception.stack : exception);
    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json({ error: 'Error interno del servidor', code: 'INTERNAL_ERROR' });
  }
}
