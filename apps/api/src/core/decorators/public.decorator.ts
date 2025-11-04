import { SetMetadata } from '@nestjs/common';

/**
 * Decorador para marcar rutas como públicas
 *
 * Las rutas marcadas con @Public() no requieren autenticación
 *
 * @example
 * ```typescript
 * @Public()
 * @Get('health')
 * getHealth() {
 *   return { status: 'ok' };
 * }
 * ```
 */
export const Public = () => SetMetadata('isPublic', true);
