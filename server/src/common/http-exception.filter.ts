import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

const describeReplacer = (_key: string, value: unknown): unknown =>
  value instanceof Error ? value.message : value;

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  private describeError(err: unknown): string {
    const parts: string[] = [];
    let current: unknown = err;
    const seen = new Set<Error>();

    while (current instanceof Error && !seen.has(current)) {
      seen.add(current);
      parts.push(current.message);
      current = (current as { cause?: unknown }).cause;
    }

    if (
      current !== undefined &&
      current !== null &&
      (typeof current === 'object' || typeof current === 'string')
    ) {
      parts.push(
        typeof current === 'string'
          ? current
          : String(JSON.stringify(current, describeReplacer)),
      );
    }

    return parts.join('\n  cause => ');
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<{ method?: string; url?: string }>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
        error = exception.name;
      } else {
        const payload = body as { message?: string | string[]; error?: string };
        message = payload.message ?? exception.message;
        error = payload.error ?? exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(this.describeError(exception), exception.stack);
    } else {
      this.logger.error('Unknown exception', exception);
    }

    const flatMessage = Array.isArray(message) ? message.join(', ') : message;

    response.status(status).json({
      statusCode: status,
      message: flatMessage,
      error,
      path: request?.url,
    });
  }
}
