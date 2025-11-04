import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SurrealDbService } from '../database';

/**
 * Guard de autenticación
 *
 * Valida que el request tenga un token JWT válido
 * y adjunta la información del usuario al request
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(
    private readonly surrealDb: SurrealDbService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Verificar si la ruta es pública
    const isPublic = this.reflector.get<boolean>(
      'isPublic',
      context.getHandler(),
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Token no proporcionado');
    }

    try {
      // Autenticar con el token
      await this.surrealDb.authenticateWithToken(token);

      // Obtener información del usuario
      const [result] = await this.surrealDb.query<any>('SELECT * FROM $auth');

      if (!result || !result.result) {
        throw new UnauthorizedException('Token inválido');
      }

      // Adjuntar usuario al request
      request.user = result.result;

      return true;
    } catch (error) {
      this.logger.error('Error en autenticación:', error);
      throw new UnauthorizedException('Token inválido o expirado');
    }
  }

  /**
   * Extrae el token del header Authorization
   */
  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      return undefined;
    }

    const [type, token] = authHeader.split(' ');

    return type === 'Bearer' ? token : undefined;
  }
}
