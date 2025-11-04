import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorador para obtener el usuario autenticado
 *
 * Extrae la información del usuario del request
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getProfile(@User() user: any) {
 *   return user;
 * }
 *
 * // Obtener solo el email
 * @Get('email')
 * getEmail(@User('email') email: string) {
 *   return { email };
 * }
 * ```
 */
export const User = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    return data ? user?.[data] : user;
  },
);
