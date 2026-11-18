import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { JwtPayload } from '../interfaces/jwt-payload.interface.js';

/** Использование: someMethod(@CurrentUser() user: JwtPayload) */
export const CurrentUser = createParamDecorator(
  (data: unknown, context: ExecutionContext): JwtPayload => {
    return context.switchToHttp().getRequest<{ user: JwtPayload }>().user;
  },
);