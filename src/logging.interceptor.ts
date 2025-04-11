import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, Observer } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private logger = new Logger(LoggingInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    if (context.getType() === 'http') {
      return this.logHttp(context, next);
    }

    return next.handle();
  }

  private logHttp(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const userAgent: string | undefined = request.get('user-agent') || '';
    const { ip, method, path: url } = request;
    const userId = request.user?.id;

    const correlationKey = uuidv4();

    this.logger.log(
      `Request received: ${method} ${url} from ${ip} with user ${userId} and correlation key ${correlationKey}`,
    );

    this.logger.log(`User agent: ${userAgent}`);

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - now;
        this.logger.log(`Request completed in ${duration}ms`);
      }),
    );
  }
}
