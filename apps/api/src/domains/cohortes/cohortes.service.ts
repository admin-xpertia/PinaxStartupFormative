import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { SurrealDbService } from "src/core/database";
import { ProgramasService } from "../programas/programas.service";
import { CreateCohorteDto, InviteEstudiantesDto } from "./dto";
import { CommunicationDto } from "./dto/communication.dto";

@Injectable()
export class CohortesService {
  private readonly logger = new Logger(CohortesService.name);

  constructor(
    private readonly surrealDb: SurrealDbService,
    private readonly programasService: ProgramasService,
  ) {}

  /**
   * Crea una cohorte con snapshot completo del programa.
   * Este es el método más crítico de la Fase 5.
   *
   * El snapshot "congela" la estructura del programa en el momento de creación
   * de la cohorte, garantizando estabilidad para los estudiantes.
   */
  async createCohorteConSnapshot(dto: CreateCohorteDto, instructorId: string) {
    if (!instructorId) {
      throw new BadRequestException("Usuario no autenticado");
    }

    this.logger.log(
      `Creando cohorte "${dto.nombre}" con snapshot del programa ${dto.programa_id_original}`,
    );

    // 1. Obtener la arquitectura completa del programa original
    const programaId = this.normalizeId(dto.programa_id_original);
    const programaOriginal =
      await this.programasService.getProgramaConArquitectura(programaId);

    // Verificar que el usuario sea el creador del programa
    const creadorId = this.extractIdFromRecord(programaOriginal.creador);
    if (creadorId !== instructorId) {
      throw new ForbiddenException(
        "No tienes permiso para crear cohortes de este programa",
      );
    }

    try {
      // 2. Construir la transacción masiva de snapshot
      const snapshotResult = await this.executeSnapshotTransaction(
        dto,
        programaOriginal,
        instructorId,
      );

      this.logger.log(
        `Cohorte creada exitosamente: ${snapshotResult.cohorte_id}`,
      );

      return snapshotResult;
    } catch (error) {
      this.logger.error("Error al crear cohorte con snapshot:", error);
      throw new InternalServerErrorException(
        "No se pudo crear la cohorte. Por favor, intenta nuevamente.",
      );
    }
  }

  /**
   * Ejecuta la transacción completa de snapshot.
   * Esta es la lógica de duplicación más compleja del sistema.
   */
  private async executeSnapshotTransaction(
    dto: CreateCohorteDto,
    programaOriginal: any,
    instructorId: string,
  ) {
    let tx = "BEGIN TRANSACTION;\n";

    // Variables para mapear IDs originales a IDs de snapshot
    const mapaVariables = new Map<string, string>();

    // 1. Crear el snapshot root del programa
    const snapshotVersion = `Snapshot ${new Date().toISOString()}`;

    tx += `
      LET $instructor = type::thing("user", "${instructorId}");
      LET $programa_original_id = type::thing("programa", "${this.normalizeId(programaOriginal.id)}");

      LET $snapshot_programa = CREATE snapshot_programa SET
        programa_original = $programa_original_id,
        version = "${this.escapeSql(snapshotVersion)}",
        nombre = "${this.escapeSql(programaOriginal.nombre)}",
        descripcion = "${this.escapeSql(programaOriginal.descripcion || "")}",
        instructor = $instructor;
    `;

    // 2. Crear la cohorte y vincularla al snapshot
    tx += `
      LET $cohorte = CREATE cohorte SET
        nombre = "${this.escapeSql(dto.nombre)}",
        fecha_inicio = "${dto.fecha_inicio}",
        ${dto.fecha_fin_estimada ? `fecha_fin_estimada = "${dto.fecha_fin_estimada}",` : ""}
        instructor = $instructor,
        snapshot_programa = $snapshot_programa.id;
    `;

    // 3. Duplicar toda la jerarquía del programa
    if (programaOriginal.fases && Array.isArray(programaOriginal.fases)) {
      for (const fase of programaOriginal.fases) {
        const faseId = this.extractIdFromRecord(fase.id);
        const faseVar = `fase_${this.sanitizeVarName(faseId)}`;
        mapaVariables.set(fase.id, `$${faseVar}`);

        tx += `
          LET $${faseVar} = CREATE snapshot_fase SET
            snapshot_programa = $snapshot_programa.id,
            fase_original = type::thing("fase", "${faseId}"),
            nombre = "${this.escapeSql(fase.nombre)}",
            numero_fase = ${fase.numero_fase || 0},
            orden = ${fase.orden || 0};
        `;

        // 3.1. Duplicar ProofPoints
        if (fase.proof_points && Array.isArray(fase.proof_points)) {
          for (const pp of fase.proof_points) {
            const ppId = this.extractIdFromRecord(pp.id);
            const ppVar = `pp_${this.sanitizeVarName(ppId)}`;
            mapaVariables.set(pp.id, `$${ppVar}`);

            tx += `
              LET $${ppVar} = CREATE snapshot_proofpoint SET
                snapshot_fase = $${faseVar}.id,
                proofpoint_original = type::thing("proofpoint", "${ppId}"),
                nombre = "${this.escapeSql(pp.nombre)}",
                pregunta_central = "${this.escapeSql(pp.pregunta_central || "")}",
                orden_en_fase = ${pp.orden_en_fase || 0},
                prerequisitos = [];
            `;

            // 3.2. Duplicar Niveles
            if (pp.niveles && Array.isArray(pp.niveles)) {
              for (const nivel of pp.niveles) {
                const nivelId = this.extractIdFromRecord(nivel.id);
                const nivelVar = `nivel_${this.sanitizeVarName(nivelId)}`;
                mapaVariables.set(nivel.id, `$${nivelVar}`);

                tx += `
                  LET $${nivelVar} = CREATE snapshot_nivel SET
                    snapshot_proofpoint = $${ppVar}.id,
                    nivel_original = type::thing("nivel", "${nivelId}"),
                    numero_nivel = ${nivel.numero || nivel.numero_nivel || 0},
                    objetivo_especifico = "${this.escapeSql(nivel.objetivo_especifico || nivel.objetivo || "Objetivo pendiente")}",
                    criterio_completacion = ${JSON.stringify(nivel.criterio_completacion || {})};
                `;

                // 3.3. Duplicar Componentes
                if (nivel.componentes && Array.isArray(nivel.componentes)) {
                  for (const comp of nivel.componentes) {
                    const compId = this.extractIdFromRecord(comp.id);
                    const compVar = `comp_${this.sanitizeVarName(compId)}`;
                    mapaVariables.set(comp.id, `$${compVar}`);

                    // 3.3.1. Obtener y duplicar el contenido del componente
                    const contenidoVar = `cont_${this.sanitizeVarName(compId)}`;

                    // Verificar si el componente tiene contenido
                    if (comp.version_contenido_actual) {
                      const contenidoId = this.extractIdFromRecord(
                        comp.version_contenido_actual,
                      );

                      tx += `
                        LET $contenido_original_${contenidoVar} = (SELECT * FROM type::thing("componente_contenido", "${contenidoId}") LIMIT 1)[0];
                        LET $${contenidoVar} = IF $contenido_original_${contenidoVar} != NONE THEN (
                          CREATE snapshot_contenido SET
                            contenido_original = type::thing("componente_contenido", "${contenidoId}"),
                            contenido = $contenido_original_${contenidoVar}.contenido
                        ) ELSE NONE END;
                      `;
                    } else {
                      tx += `
                        LET $${contenidoVar} = NONE;
                      `;
                    }

                    // 3.3.2. Obtener y duplicar la rúbrica si existe
                    const rubricaVar = `rub_${this.sanitizeVarName(compId)}`;

                    tx += `
                      LET $rubrica_original_${rubricaVar} = (SELECT * FROM rubrica_evaluacion WHERE componente = type::thing("componente", "${compId}") LIMIT 1)[0];
                      LET $${rubricaVar} = IF $rubrica_original_${rubricaVar} != NONE THEN (
                        CREATE snapshot_rubrica SET
                          rubrica_original = $rubrica_original_${rubricaVar}.id,
                          dimensiones = $rubrica_original_${rubricaVar}.dimensiones
                      ) ELSE NONE END;
                    `;

                    // 3.3.3. Crear el componente snapshot
                    tx += `
                      LET $${compVar} = CREATE snapshot_componente SET
                        snapshot_nivel = $${nivelVar}.id,
                        componente_original = type::thing("componente", "${compId}"),
                        tipo = "${this.escapeSql(comp.tipo || "leccion")}",
                        nombre = "${this.escapeSql(comp.nombre)}",
                        orden = ${comp.orden || 0},
                        contenido = IF $${contenidoVar} != NONE THEN $${contenidoVar}.id ELSE NONE END,
                        rubrica = IF $${rubricaVar} != NONE THEN $${rubricaVar}.id ELSE NONE END,
                        prerequisitos = [];
                    `;

                    // 3.3.4. Actualizar los back-references del contenido y rúbrica
                    tx += `
                      IF $${contenidoVar} != NONE THEN
                        UPDATE $${contenidoVar}.id SET snapshot_componente = $${compVar}.id
                      END;
                      IF $${rubricaVar} != NONE THEN
                        UPDATE $${rubricaVar}.id SET snapshot_componente = $${compVar}.id
                      END;
                    `;
                  }
                }
              }
            }
          }
        }
      }

      // 4. Segunda pasada: Reconectar prerequisitos
      // Los prerequisitos deben apuntar a los IDs del snapshot, no a los originales
      this.logger.debug(
        "Iniciando segunda pasada para reconectar prerequisitos",
      );

      for (const fase of programaOriginal.fases) {
        if (fase.proof_points && Array.isArray(fase.proof_points)) {
          for (const pp of fase.proof_points) {
            if (
              pp.prerequisitos &&
              Array.isArray(pp.prerequisitos) &&
              pp.prerequisitos.length > 0
            ) {
              const ppVar = mapaVariables.get(pp.id);
              if (ppVar) {
                const prerequisitosSnapshotIds = pp.prerequisitos
                  .map((prereqId: string) => mapaVariables.get(prereqId))
                  .filter((v: string | undefined) => v !== undefined);

                if (prerequisitosSnapshotIds.length > 0) {
                  tx += `
                    UPDATE ${ppVar}.id SET prerequisitos = [${prerequisitosSnapshotIds.map((v: string) => `${v}.id`).join(", ")}];
                  `;
                }
              }
            }

            // Prerequisitos de componentes
            if (pp.niveles && Array.isArray(pp.niveles)) {
              for (const nivel of pp.niveles) {
                if (nivel.componentes && Array.isArray(nivel.componentes)) {
                  for (const comp of nivel.componentes) {
                    if (
                      comp.prerequisitos &&
                      Array.isArray(comp.prerequisitos) &&
                      comp.prerequisitos.length > 0
                    ) {
                      const compVar = mapaVariables.get(comp.id);
                      if (compVar) {
                        const prerequisitosSnapshotIds = comp.prerequisitos
                          .map((prereqId: string) =>
                            mapaVariables.get(prereqId),
                          )
                          .filter((v: string | undefined) => v !== undefined);

                        if (prerequisitosSnapshotIds.length > 0) {
                          tx += `
                            UPDATE ${compVar}.id SET prerequisitos = [${prerequisitosSnapshotIds.map((v: string) => `${v}.id`).join(", ")}];
                          `;
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }

    // 5. Finalizar transacción y retornar
    tx += `
      COMMIT TRANSACTION;
      RETURN {
        cohorte: $cohorte,
        snapshot_programa: $snapshot_programa
      };
    `;

    this.logger.debug(
      `Ejecutando transacción de snapshot (${tx.length} caracteres)`,
    );

    // Ejecutar la transacción masiva
    const result = await this.surrealDb.query<any>(tx);

    // El resultado está en el último elemento del array
    const finalResult = result[result.length - 1];

    if (!finalResult || !finalResult.cohorte) {
      throw new InternalServerErrorException(
        "La transacción de snapshot no retornó el resultado esperado",
      );
    }

    return {
      cohorte_id: finalResult.cohorte.id,
      snapshot_programa_id: finalResult.snapshot_programa.id,
      cohorte: finalResult.cohorte,
      snapshot_programa: finalResult.snapshot_programa,
    };
  }

  /**
   * Obtiene todas las cohortes creadas por un instructor
   */
  async findAllByInstructor(instructorId: string): Promise<any[]> {
    if (!instructorId) {
      return [];
    }

    try {
      const query = `
        SELECT * FROM cohorte
        WHERE instructor = type::thing("user", "${instructorId}")
        ORDER BY created_at DESC;
      `;

      const result = await this.surrealDb.query<any[]>(query);
      return result || [];
    } catch (error) {
      this.logger.error(
        `Error al obtener cohortes del instructor ${instructorId}:`,
        error,
      );
      throw new InternalServerErrorException(
        "No se pudieron obtener las cohortes",
      );
    }
  }

  /**
   * Obtiene una cohorte por ID con su información de snapshot
   */
  async findCohorteById(
    cohorteId: string,
    instructorId?: string,
  ): Promise<any> {
    try {
      const normalizedId = this.normalizeId(cohorteId);

      const query = `
        SELECT *,
               snapshot_programa.* AS snapshot_info
        FROM type::thing("cohorte", "${normalizedId}")
        FETCH snapshot_programa;
      `;

      const result = await this.surrealDb.query<any[]>(query);
      const cohorte = result?.[0];

      if (!cohorte) {
        throw new NotFoundException(
          `Cohorte con ID ${cohorteId} no encontrada`,
        );
      }

      // Verificar permisos si se proporciona instructorId
      if (instructorId) {
        const instructorCohorteId = this.extractIdFromRecord(
          cohorte.instructor,
        );
        if (instructorCohorteId !== instructorId) {
          throw new ForbiddenException(
            "No tienes permiso para acceder a esta cohorte",
          );
        }
      }

      return cohorte;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(`Error al obtener cohorte ${cohorteId}:`, error);
      throw new InternalServerErrorException("Error al obtener la cohorte");
    }
  }

  /**
   * Obtiene la lista de estudiantes inscritos en una cohorte
   */
  async findEstudiantesByCohorte(cohorteId: string): Promise<any[]> {
    try {
      const normalizedId = this.normalizeId(cohorteId);

      const query = `
        SELECT
          id AS inscripcion_id,
          estudiante.*,
          estado,
          fecha_inscripcion
        FROM inscripcion_cohorte
        WHERE cohorte = type::thing("cohorte", "${normalizedId}")
        FETCH estudiante
        ORDER BY fecha_inscripcion DESC;
      `;

      const result = await this.surrealDb.query<any[]>(query);
      return result || [];
    } catch (error) {
      this.logger.error(
        `Error al obtener estudiantes de cohorte ${cohorteId}:`,
        error,
      );
      throw new InternalServerErrorException(
        "No se pudieron obtener los estudiantes",
      );
    }
  }

  /**
   * Invita estudiantes a una cohorte.
   * Crea usuarios y perfiles de estudiante si no existen, luego los inscribe en la cohorte.
   */
  async invitarEstudiantes(
    cohorteId: string,
    dto: InviteEstudiantesDto,
    instructorId: string,
  ): Promise<{ success: boolean; inscripciones: any[] }> {
    // Verificar que el instructor sea el dueño de la cohorte
    const cohorte = await this.findCohorteById(cohorteId, instructorId);

    const normalizedCohorteId = this.normalizeId(cohorteId);
    const inscripciones: any[] = [];

    try {
      this.logger.log(
        `Invitando ${dto.emails.length} estudiante(s) a cohorte ${cohorteId}`,
      );

      // Procesar cada email
      for (const email of dto.emails) {
        const escapedEmail = this.escapeSql(email);

        const query = `
          BEGIN TRANSACTION;

          -- 1. Buscar o crear usuario (auth/identity)
          LET $user = (SELECT * FROM user WHERE email = "${escapedEmail}" LIMIT 1);

          LET $usuario_final = IF array::len($user) == 0 THEN (
            CREATE user SET
              email = "${escapedEmail}",
              rol = 'estudiante',
              nombre = "${escapedEmail}",
              created_at = time::now()
          )[0] ELSE $user[0] END;

          -- 2. Buscar o crear perfil de estudiante
          LET $estudiante_existente = (SELECT * FROM estudiante WHERE user = $usuario_final.id LIMIT 1);

          LET $estudiante_final = IF array::len($estudiante_existente) == 0 THEN (
            CREATE estudiante SET
              user = $usuario_final.id,
              metadata = {},
              intereses = [],
              created_at = time::now()
          )[0] ELSE $estudiante_existente[0] END;

          -- 3. Verificar si ya está inscrito en esta cohorte
          LET $inscripcion_existente = (
            SELECT * FROM inscripcion_cohorte
            WHERE estudiante = $estudiante_final.id
            AND cohorte = type::thing("cohorte", "${normalizedCohorteId}")
            LIMIT 1
          );

          -- 4. Crear o actualizar inscripción (usando el record de estudiante, no user)
          LET $inscripcion = IF array::len($inscripcion_existente) == 0 THEN (
            CREATE inscripcion_cohorte SET
              estudiante = $estudiante_final.id,
              cohorte = type::thing("cohorte", "${normalizedCohorteId}"),
              estado = 'activo',
              fecha_inscripcion = time::now()
          )[0] ELSE (
            UPDATE $inscripcion_existente[0].id SET
              estado = 'activo'
          )[0] END;

          COMMIT TRANSACTION;

          RETURN {
            usuario: $usuario_final,
            estudiante: $estudiante_final,
            inscripcion: $inscripcion,
            ya_existia: array::len($inscripcion_existente) > 0
          };
        `;

        const result = await this.surrealDb.query<any[]>(query);
        const inscripcionResult = result[result.length - 1];

        if (inscripcionResult) {
          inscripciones.push(inscripcionResult);
        }
      }

      this.logger.log(
        `${inscripciones.length} estudiante(s) invitado(s) exitosamente`,
      );

      return {
        success: true,
        inscripciones,
      };
    } catch (error) {
      this.logger.error(
        `Error al invitar estudiantes a cohorte ${cohorteId}:`,
        error,
      );
      throw new InternalServerErrorException(
        "Error al invitar estudiantes a la cohorte",
      );
    }
  }

  /**
   * Normaliza un ID de SurrealDB removiendo el prefijo de tabla si existe
   */
  private normalizeId(id: string): string {
    if (!id) {
      throw new BadRequestException("ID inválido");
    }

    const parts = id.trim().split(":");
    return parts.length > 1 ? parts[parts.length - 1] : id.trim();
  }

  /**
   * Extrae el ID de un record de SurrealDB (maneja tanto strings como objetos)
   */
  private extractIdFromRecord(record: any): string {
    if (!record) {
      throw new BadRequestException("Record inválido");
    }

    if (typeof record === "string") {
      return this.normalizeId(record);
    }

    if (record.id) {
      return this.normalizeId(record.id);
    }

    throw new BadRequestException("No se pudo extraer ID del record");
  }

  /**
   * Escapa caracteres especiales en strings para SurrealQL
   */
  private escapeSql(str: string): string {
    if (!str) return "";
    return str
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
  }

  /**
   * Sanitiza strings para usarlos como nombres de variables en SurrealQL
   */
  private sanitizeVarName(str: string): string {
    return str.replace(/[^a-zA-Z0-9_]/g, "_");
  }

  /**
   * Obtiene el historial de comunicaciones de una cohorte.
   *
   * MVP: Por ahora devolvemos un array vacío ya que el sistema de comunicaciones
   * será implementado en una fase posterior.
   *
   * TODO: Implementar sistema completo de comunicaciones con:
   * - Tabla 'comunicacion' en DB
   * - Envío de emails a estudiantes
   * - Tracking de apertura/lectura
   * - Anuncios y notificaciones push
   * - Plantillas de mensajes
   */
  async getComunicaciones(
    cohorteId: string,
    instructorId: string,
  ): Promise<CommunicationDto[]> {
    try {
      // Verificar que la cohorte existe y pertenece al instructor
      const cohorteNormalizada = this.normalizeId(cohorteId);
      const cohorte = await this.findCohorteById(
        cohorteNormalizada,
        instructorId,
      );

      if (!cohorte) {
        throw new NotFoundException(
          `Cohorte con ID ${cohorteId} no encontrada`,
        );
      }

      // MVP: Devolver array vacío
      // En el futuro, aquí haría una query a la tabla 'comunicacion'
      // SELECT * FROM comunicacion WHERE cohorte = type::thing("cohorte", $cohorteId)
      // ORDER BY fecha_envio DESC

      this.logger.log(
        `Obteniendo comunicaciones para cohorte ${cohorteId} (MVP: retornando array vacío)`,
      );

      return [];

      // Ejemplo de datos que retornaría en el futuro:
      // return [
      //   {
      //     id: 'comunicacion:123',
      //     tipo: 'email',
      //     asunto: 'Bienvenida a la cohorte',
      //     contenido: 'Hola estudiantes...',
      //     fecha_envio: '2025-01-15T10:00:00Z',
      //     destinatarios: 25,
      //     leidos: 20
      //   }
      // ];
    } catch (error) {
      this.logger.error(
        `Error getting comunicaciones for cohorte ${cohorteId}:`,
        error,
      );

      // Si es un error conocido, re-lanzarlo
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      // Para otros errores, devolver array vacío en lugar de fallar
      // (el frontend puede funcionar sin comunicaciones)
      return [];
    }
  }
}
