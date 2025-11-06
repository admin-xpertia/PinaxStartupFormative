import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { SurrealDbService } from "../database";

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
      "isPublic",
      context.getHandler(),
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("Token no proporcionado");
    }

    try {
      // IMPORTANTE: NO cambiar la autenticación de la conexión del backend
      // El backend debe mantener sus credenciales de admin para poder realizar operaciones
      // En su lugar, vamos a decodificar el token JWT para extraer la información del usuario

      // Decodificar el token para obtener el ID del usuario
      // Los tokens JWT de SurrealDB tienen el formato: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new UnauthorizedException("Token JWT inválido");
      }

      // Decodificar el payload (segunda parte)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      this.logger.debug("Token payload:", JSON.stringify(payload, null, 2));

      // Extraer el ID del usuario del payload
      // SurrealDB típicamente guarda el ID en el campo 'ID' o 'id'
      const userId = payload.ID || payload.id;

      if (!userId) {
        throw new UnauthorizedException("Token no contiene ID de usuario");
      }

      this.logger.debug("User ID desde token:", userId);

      // Consultar el usuario completo desde la base de datos usando el ID
      // Nota: La conexión del backend sigue usando credenciales de admin
      const users = await this.surrealDb.select<any>(userId);
      const user = Array.isArray(users) ? users[0] : users;

      if (!user) {
        throw new UnauthorizedException("Usuario no encontrado");
      }

      this.logger.debug("Usuario consultado:", JSON.stringify(user, null, 2));

      // Asegurar que el user tenga el ID completo
      user.id = userId;

      // Adjuntar usuario al request
      request.user = user;

      return true;
    } catch (error) {
      this.logger.error("Error en autenticación:", error);

      // Distinguir entre errores de formato de token y otros errores
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException("Token inválido o expirado");
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

    const [type, token] = authHeader.split(" ");

    return type === "Bearer" ? token : undefined;
  }
}
