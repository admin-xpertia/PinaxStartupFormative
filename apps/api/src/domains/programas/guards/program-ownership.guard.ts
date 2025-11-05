import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { SurrealDbService } from "src/core/database";

/**
 * Guard de autorización que verifica si el usuario autenticado es el propietario
 * del recurso (Programa, Fase, ProofPoint, Nivel, Componente) que intenta acceder.
 *
 * Este guard es inteligente y determina qué tipo de recurso verificar basándose
 * en los parámetros de la ruta.
 *
 * Ejemplos de uso:
 * - GET /programas/:id/arquitectura → Verifica que el usuario sea creador del programa
 * - PUT /proofpoints/:id/prerequisitos → Verifica que el usuario sea creador del programa padre
 * - PATCH /fases/:id → Verifica que el usuario sea creador del programa padre
 *
 * IMPORTANTE: Este guard depende de que AuthGuard haya sido ejecutado primero,
 * para que request.user esté disponible.
 */
@Injectable()
export class ProgramOwnershipGuard implements CanActivate {
  private readonly logger = new Logger(ProgramOwnershipGuard.name);

  constructor(private readonly surrealDb: SurrealDbService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;

    // Validar que el usuario esté autenticado (debería estar garantizado por AuthGuard)
    if (!user || !user.id) {
      this.logger.warn("Usuario no autenticado intentando acceder a recurso protegido");
      throw new ForbiddenException("Usuario no autenticado");
    }

    const userId = user.id;
    this.logger.debug(`Verificando propiedad para usuario: ${userId}`);
    this.logger.debug(`Parámetros de ruta: ${JSON.stringify(params)}`);

    let query: string;
    let resourceId: string;
    let resourceType: string;

    // Determinar el tipo de recurso y construir la consulta apropiada
    // Basado en los parámetros de la ruta
    if (params.id && request.route.path.includes("/programas/:id")) {
      // Caso: GET /programas/:id/arquitectura
      resourceType = "programa";
      resourceId = params.id.includes(":") ? params.id : `programa:${params.id}`;
      query = `
        SELECT id FROM type::thing("programa", "${params.id}")
        WHERE creador = type::thing("usuario", "${userId}");
      `;
    } else if (params.faseId) {
      // Caso: Operaciones sobre fases (ej. PUT /fases/:faseId)
      resourceType = "fase";
      resourceId = params.faseId.includes(":")
        ? params.faseId
        : `fase:${params.faseId}`;
      query = `
        SELECT id FROM type::thing("fase", "${params.faseId}")
        WHERE programa.creador = type::thing("usuario", "${userId}");
      `;
    } else if (params.id && request.route.path.includes("/proofpoints/:id")) {
      // Caso: PUT /proofpoints/:id/prerequisitos
      resourceType = "proof_point";
      resourceId = params.id.includes(":") ? params.id : `proof_point:${params.id}`;
      query = `
        SELECT id FROM type::thing("proof_point", "${params.id}")
        WHERE fase.programa.creador = type::thing("usuario", "${userId}");
      `;
    } else if (params.nivelId) {
      // Caso: Operaciones sobre niveles
      resourceType = "nivel";
      resourceId = params.nivelId.includes(":")
        ? params.nivelId
        : `nivel:${params.nivelId}`;
      query = `
        SELECT id FROM type::thing("nivel", "${params.nivelId}")
        WHERE proof_point.fase.programa.creador = type::thing("usuario", "${userId}");
      `;
    } else if (params.componenteId) {
      // Caso: Operaciones sobre componentes
      resourceType = "componente";
      resourceId = params.componenteId.includes(":")
        ? params.componenteId
        : `componente:${params.componenteId}`;
      query = `
        SELECT id FROM type::thing("componente", "${params.componenteId}")
        WHERE nivel.proof_point.fase.programa.creador = type::thing("usuario", "${userId}");
      `;
    } else {
      // No hay parámetro de ID para verificar (ej. POST /programas)
      // En este caso, el AuthGuard es suficiente
      this.logger.debug("No se requiere verificación de propiedad para esta ruta");
      return true;
    }

    try {
      this.logger.debug(`Ejecutando query de verificación: ${query}`);

      // Ejecutar la consulta de verificación
      const result = await this.surrealDb.query<any>(query);
      const records = result?.[0];

      // Si la consulta devuelve un resultado, el usuario es el propietario
      if (records && Array.isArray(records) && records.length > 0) {
        this.logger.log(
          `Acceso autorizado: Usuario ${userId} es propietario de ${resourceType} ${resourceId}`,
        );
        return true;
      }

      // Si no hay resultados, el usuario no es propietario o el recurso no existe
      this.logger.warn(
        `Acceso denegado: Usuario ${userId} no es propietario de ${resourceType} ${resourceId}`,
      );
      throw new ForbiddenException(
        "No tienes permiso para acceder a este recurso",
      );
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error(
        `Error al verificar propiedad del recurso ${resourceId}:`,
        error,
      );
      throw new ForbiddenException(
        "Error al verificar permisos del recurso",
      );
    }
  }
}
