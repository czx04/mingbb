import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Response } from "express";

export class RateLimitExceededException extends HttpException {
  constructor(
    readonly retryAfterSeconds: number,
    message: string,
  ) {
    super(message, HttpStatus.TOO_MANY_REQUESTS);
  }
}

@Catch(RateLimitExceededException)
export class RateLimitExceptionFilter implements ExceptionFilter {
  catch(exception: RateLimitExceededException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    response
      .setHeader("Retry-After", String(exception.retryAfterSeconds))
      .status(HttpStatus.TOO_MANY_REQUESTS)
      .json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: exception.message,
      });
  }
}
