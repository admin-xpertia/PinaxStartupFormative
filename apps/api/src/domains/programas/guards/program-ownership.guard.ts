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
    const body = request.body; // NUEVO: También verificar en el body

    // Validar que el usuario esté autenticado (debería estar garantizado por AuthGuard)
    if (!user || !user.id) {
      this.logger.warn(
        "Usuario no autenticado intentando acceder a recurso protegido",
      );
      throw new ForbiddenException("Usuario no autenticado");
    }

    const userId = user.id;
    this.logger.debug(`Verificando propiedad para usuario: ${userId}`);
    this.logger.debug(`Parámetros de ruta: ${JSON.stringify(params)}`);
    this.logger.debug(`Body presente: ${body ? "Sí" : "No"}`);

    // Limpiar el userId si incluye el prefijo "user:"
    const cleanUserId = this.cleanRecordId(userId, "user");

    let query: string;
    let resourceId: string;
    let resourceType: string;

    // Determinar el tipo de recurso y construir la consulta apropiada
    // Basado en los parámetros de la ruta o el body
    if (params.id && request.route.path.includes("/programas/:id")) {
      // Caso: GET /programas/:id/arquitectura
      resourceType = "programa";
      const cleanProgramaId = this.cleanRecordId(params.id, "programa");
      resourceId = params.id.includes(":")
        ? params.id
        : `programa:${params.id}`;
      query = `
        SELECT id FROM type::thing("programa", "${cleanProgramaId}")
        WHERE creador = type::thing("user", "${cleanUserId}");
      `;
    } else if (params.faseId) {
      // Caso: Operaciones sobre fases (ej. PUT /fases/:faseId)
      resourceType = "fase";
      const cleanFaseId = this.cleanRecordId(params.faseId, "fase");
      resourceId = params.faseId.includes(":")
        ? params.faseId
        : `fase:${params.faseId}`;
      query = `
        SELECT id FROM type::thing("fase", "${cleanFaseId}")
        WHERE programa.creador = type::thing("user", "${cleanUserId}");
      `;
    } else if (params.id && request.route.path.includes("/proofpoints/:id")) {
      // Caso: PUT /proofpoints/:id/prerequisitos
      resourceType = "proof_point";
      const cleanProofPointId = this.cleanRecordId(params.id, "proof_point");
      resourceId = params.id.includes(":")
        ? params.id
        : `proof_point:${params.id}`;
      query = `
        SELECT id FROM type::thing("proof_point", "${cleanProofPointId}")
        WHERE fase.programa.creador = type::thing("user", "${cleanUserId}");
      `;
    } else if (params.nivelId) {
      // Caso: Operaciones sobre niveles
      resourceType = "nivel";
      const cleanNivelId = this.cleanRecordId(params.nivelId, "nivel");
      resourceId = params.nivelId.includes(":")
        ? params.nivelId
        : `nivel:${params.nivelId}`;
      query = `
        SELECT id FROM type::thing("nivel", "${cleanNivelId}")
        WHERE proof_point.fase.programa.creador = type::thing("user", "${cleanUserId}");
      `;
    } else if (params.componenteId) {
      // Caso: Operaciones sobre componentes (desde params)
      resourceType = "componente";
      const cleanComponenteId = this.cleanRecordId(params.componenteId, "componente");
      resourceId = params.componenteId.includes(":")
        ? params.componenteId
        : `componente:${params.componenteId}`;
      query = `
        SELECT id FROM type::thing("componente", "${cleanComponenteId}")
        WHERE nivel.proof_point.fase.programa.creador = type::thing("user", "${cleanUserId}");
      `;
    } else if (body?.componenteId) {
      // Caso: Operaciones sobre componentes (desde body)
      // Ejemplo: POST /generacion/componente con { componenteId: "..." }
      const componenteId = body.componenteId.includes(":")
        ? body.componenteId.split(":")[1]
        : body.componenteId;

      resourceType = "componente";
      resourceId = body.componenteId.includes(":")
        ? body.componenteId
        : `componente:${componenteId}`;

      this.logger.debug(
        `Verificando propiedad de componente desde body: ${componenteId}`,
      );

      query = `
        SELECT id FROM type::thing("componente", "${componenteId}")
        WHERE nivel.proof_point.fase.programa.creador = type::thing("user", "${cleanUserId}");
      `;
    } else {
      // No hay parámetro de ID para verificar (ej. POST /programas)
      // En este caso, el AuthGuard es suficiente
      this.logger.debug(
        "No se requiere verificación de propiedad para esta ruta",
      );
      return true;
    }

    try {
      this.logger.debug(`Ejecutando query de verificación: ${query}`);

      // Ejecutar la consulta de verificación
      const result = await this.surrealDb.query<any>(query);

      // El método query() ahora retorna el resultado desempaquetado directamente
      // Si es un array con elementos, el usuario es propietario
      const records = Array.isArray(result) ? result : [result];

      this.logger.debug(`Records recibidos: ${JSON.stringify(records)}`);

      // Si la consulta devuelve un resultado, el usuario es el propietario
      if (records && records.length > 0 && records[0]) {
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
      throw new ForbiddenException("Error al verificar permisos del recurso");
    }
  }

  /**
   * Limpia el prefijo de tabla de un ID si está presente
   * Ejemplo: "user:abc123" -> "abc123"
   */
  private cleanRecordId(id: string, table: string): string {
    if (!id) return id;
    const prefix = `${table}:`;
    return id.startsWith(prefix) ? id.substring(prefix.length) : id;
  }
}
