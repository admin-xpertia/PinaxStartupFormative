import {
  Injectable,
  InternalServerErrorException,
  Logger,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { SurrealDbService } from "src/core/database";
import {
  CreateProgramDto,
  ArquitecturaResponseDto,
  OrdenItemDto,
  UpdatePrerequisitosDto,
} from "./dto";
import { ProgramaCreado } from "./types";

@Injectable()
export class ProgramasService {
  private readonly logger = new Logger(ProgramasService.name);

  constructor(private readonly surrealDb: SurrealDbService) {}

  /**
   * Crea un programa completo desde el wizard de forma transaccional.
   * Si alguna operación falla, toda la transacción se revierte.
   */
  async createFromWizard(
    data: CreateProgramDto,
    creatorId: string | null,
  ): Promise<ProgramaCreado> {
    if (!creatorId) {
      throw new BadRequestException(
        "Usuario no autenticado o ID de usuario inválido",
      );
    }

    const {
      nombre_programa,
      descripcion,
      categoria,
      duracion_semanas,
      numero_fases,
      fases,
    } = data;

    try {
      this.logger.log(
        `Creando programa "${nombre_programa}" para usuario ${creatorId}`,
      );

      // Construir la transacción completa en SurrealQL
      let tx = "BEGIN TRANSACTION;\n";

      // 1. Crear el Programa
      tx += `
        LET $creador = type::thing("usuario", "${creatorId}");
        LET $programa = CREATE programa SET
          nombre = "${this.escapeSql(nombre_programa)}",
          descripcion = "${this.escapeSql(descripcion)}",
          categoria = "${this.escapeSql(categoria)}",
          duracion_semanas = ${duracion_semanas},
          numero_fases = ${numero_fases},
          creador = $creador,
          created_at = time::now();
      `;

      // 2. Iterar sobre las Fases
      for (const fase of fases) {
        tx += `
          LET $fase_${this.sanitizeId(fase.id)} = CREATE fase SET
            nombre = "${this.escapeSql(fase.nombre_fase)}",
            descripcion = "${this.escapeSql(fase.descripcion_fase)}",
            objetivos_aprendizaje = "${this.escapeSql(fase.objetivos_aprendizaje)}",
            duracion_semanas = ${fase.duracion_semanas_fase},
            numero_proof_points = ${fase.numero_proof_points},
            programa = $programa.id,
            created_at = time::now();
        `;

        // 3. Iterar sobre los ProofPoints de cada Fase
        for (const pp of fase.proof_points) {
          tx += `
            LET $pp_${this.sanitizeId(pp.id)} = CREATE proofpoint SET
              nombre = "${this.escapeSql(pp.nombre_pp)}",
              slug = "${this.escapeSql(pp.slug_pp)}",
              descripcion = "${this.escapeSql(pp.descripcion_pp)}",
              pregunta_central = "${this.escapeSql(pp.pregunta_central)}",
              tipo_entregable = "${this.escapeSql(pp.tipo_entregable)}",
              numero_niveles = ${pp.numero_niveles},
              prerequisitos = ${JSON.stringify(pp.prerequisitos)},
              duracion_estimada_horas = ${pp.duracion_estimada_horas},
              fase = $fase_${this.sanitizeId(fase.id)}.id,
              created_at = time::now();
          `;

          // 4. Crear Niveles placeholder para cada ProofPoint
          for (let i = 0; i < pp.numero_niveles; i++) {
            const nivelNumero = i + 1;
            tx += `
              LET $nivel_${this.sanitizeId(pp.id)}_${nivelNumero} = CREATE nivel SET
                numero = ${nivelNumero},
                nombre = "Nivel ${nivelNumero}",
                objetivo_especifico = "Objetivo pendiente de definir",
                proof_point = $pp_${this.sanitizeId(pp.id)}.id,
                created_at = time::now();

              CREATE componente SET
                nombre = "Lección (pendiente)",
                tipo = "leccion",
                orden = 1,
                nivel = $nivel_${this.sanitizeId(pp.id)}_${nivelNumero}.id,
                created_at = time::now();
            `;
          }
        }
      }

      // Finalizar transacción y retornar el programa creado
      tx += `
        COMMIT TRANSACTION;
        RETURN $programa;
      `;

      this.logger.debug(`Ejecutando transacción SurrealQL:\n${tx}`);

      // Ejecutar la transacción completa
      const result = await this.surrealDb.query<any>(tx);

      // SurrealDB devuelve un array de resultados
      // El último elemento debería ser el RETURN $programa
      const programaCreado = result?.[result.length - 1]?.[0];

      if (!programaCreado || !programaCreado.id) {
        throw new InternalServerErrorException(
          "No se pudo crear el programa, la transacción no retornó el programa esperado",
        );
      }

      this.logger.log(
        `Programa creado exitosamente: ${programaCreado.id} - ${programaCreado.nombre}`,
      );

      return programaCreado as ProgramaCreado;
    } catch (error) {
      this.logger.error("Fallo la transacción de creación de programa:", error);

      // Si la transacción falla, SurrealDB automáticamente hace rollback
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        `No se pudo crear el programa: ${error.message}`,
      );
    }
  }

  /**
   * Obtiene todos los programas creados por un usuario específico
   */
  async findAllByCreator(creatorId: string | null): Promise<any[]> {
    if (!creatorId) {
      return [];
    }

    try {
      const query = `
        SELECT * FROM programa
        WHERE creador = type::thing("usuario", "${creatorId}")
        ORDER BY created_at DESC;
      `;

      const result = await this.surrealDb.query<any[]>(query);
      return result || [];
    } catch (error) {
      this.logger.error(
        `Error al obtener programas del usuario ${creatorId}:`,
        error,
      );
      throw new InternalServerErrorException(
        "No se pudieron obtener los programas",
      );
    }
  }

  /**
   * Obtiene un programa con toda su arquitectura anidada usando FETCH de SurrealDB.
   * Retorna la jerarquía completa: Programa -> Fases -> ProofPoints -> Niveles -> Componentes
   *
   * @param programaId - ID del programa (sin el prefijo "programa:")
   * @returns Programa con toda su estructura anidada
   */
  async getProgramaConArquitectura(
    programaId: string,
  ): Promise<ArquitecturaResponseDto> {
    try {
      this.logger.log(
        `Obteniendo arquitectura completa del programa: ${programaId}`,
      );

      // Usar FETCH de SurrealDB para obtener el grafo completo de objetos
      // FETCH permite traer relaciones anidadas en una sola query
      const query = `
        SELECT * FROM type::thing("programa", "${programaId}")
        FETCH fase, fase.proofpoint, fase.proofpoint.nivel, fase.proofpoint.nivel.componente;
      `;

      this.logger.debug(`Ejecutando query: ${query}`);

      const result = await this.surrealDb.query<any>(query);
      const programa = result?.[0]?.[0];

      if (!programa) {
        throw new NotFoundException(
          `Programa con ID ${programaId} no encontrado`,
        );
      }

      // Organizar y ordenar los datos para mejor presentación
      if (programa.fase && Array.isArray(programa.fase)) {
        // Renombrar 'fase' a 'fases' para consistencia con el DTO
        programa.fases = programa.fase;
        delete programa.fase;

        // Ordenar fases por created_at o por un campo 'orden' si existe
        programa.fases.sort((a: any, b: any) => {
          if (a.orden !== undefined && b.orden !== undefined) {
            return a.orden - b.orden;
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });

        // Para cada fase, procesar sus proof points
        for (const fase of programa.fases) {
          if (fase.proofpoint && Array.isArray(fase.proofpoint)) {
            // Renombrar 'proofpoint' a 'proof_points' para consistencia
            fase.proof_points = fase.proofpoint;
            delete fase.proofpoint;

            // Ordenar proof points
            fase.proof_points.sort((a: any, b: any) => {
              if (a.orden !== undefined && b.orden !== undefined) {
                return a.orden - b.orden;
              }
              return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            });

            // Para cada proof point, procesar sus niveles
            for (const proofPoint of fase.proof_points) {
              if (proofPoint.nivel && Array.isArray(proofPoint.nivel)) {
                // Renombrar 'nivel' a 'niveles' para consistencia
                proofPoint.niveles = proofPoint.nivel;
                delete proofPoint.nivel;

                // Ordenar niveles por número
                proofPoint.niveles.sort((a: any, b: any) => a.numero - b.numero);

                // Para cada nivel, procesar sus componentes
                for (const nivel of proofPoint.niveles) {
                  if (nivel.componente && Array.isArray(nivel.componente)) {
                    // Renombrar 'componente' a 'componentes' para consistencia
                    nivel.componentes = nivel.componente;
                    delete nivel.componente;

                    // Ordenar componentes por orden
                    nivel.componentes.sort((a: any, b: any) => a.orden - b.orden);
                  }
                }
              }
            }
          }
        }
      }

      this.logger.log(
        `Arquitectura obtenida exitosamente para programa: ${programaId}`,
      );

      return programa as ArquitecturaResponseDto;
    } catch (error) {
      this.logger.error(
        `Error al obtener arquitectura del programa ${programaId}:`,
        error,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Error al obtener la arquitectura del programa",
      );
    }
  }

  /**
   * Actualiza el orden de múltiples elementos de la arquitectura.
   * Ejecuta todas las actualizaciones en una transacción para garantizar consistencia.
   *
   * Este método es utilizado por el drag-and-drop del roadmap visual.
   *
   * IMPORTANTE: Este método verifica la propiedad de cada elemento antes de actualizarlo,
   * ya que el endpoint no tiene un parámetro :id para que el guard lo verifique.
   *
   * @param items - Array de items con sus IDs completos (ej: "fase:abc") y nuevos valores de orden
   * @param userId - ID del usuario autenticado (debe ser el creador del programa padre)
   * @returns Objeto indicando el éxito de la operación
   */
  async updateOrdenArquitectura(
    items: OrdenItemDto[],
    userId: string,
  ): Promise<{ success: boolean; updated: number }> {
    if (!items || items.length === 0) {
      throw new BadRequestException(
        "Debe proporcionar al menos un elemento para actualizar",
      );
    }

    if (!userId) {
      throw new BadRequestException("Usuario no autenticado");
    }

    try {
      this.logger.log(
        `Actualizando orden de ${items.length} elemento(s) de arquitectura para usuario ${userId}`,
      );

      // Validar que todos los IDs tengan el formato correcto (tabla:id)
      const invalidIds = items.filter(
        (item) => !item.id || !item.id.includes(":"),
      );
      if (invalidIds.length > 0) {
        throw new BadRequestException(
          `IDs inválidos encontrados (deben tener formato "tabla:id"): ${invalidIds.map((i) => i.id).join(", ")}`,
        );
      }

      // Verificar la propiedad de cada elemento antes de actualizar
      // Agrupamos por tipo de tabla para optimizar las queries
      const itemsByTable = items.reduce(
        (acc, item) => {
          const [table] = item.id.split(":");
          if (!acc[table]) acc[table] = [];
          acc[table].push(item);
          return acc;
        },
        {} as Record<string, OrdenItemDto[]>,
      );

      // Verificar propiedad para cada tipo de tabla
      for (const [table, tableItems] of Object.entries(itemsByTable)) {
        const ids = tableItems.map((item) => item.id);
        let ownershipQuery: string;

        // Construir la query de verificación según el tipo de tabla
        switch (table) {
          case "programa":
            ownershipQuery = `
              SELECT id FROM [${ids.map((id) => `${id}`).join(", ")}]
              WHERE creador = type::thing("usuario", "${userId}");
            `;
            break;
          case "fase":
            ownershipQuery = `
              SELECT id FROM [${ids.map((id) => `${id}`).join(", ")}]
              WHERE programa.creador = type::thing("usuario", "${userId}");
            `;
            break;
          case "proof_point":
            ownershipQuery = `
              SELECT id FROM [${ids.map((id) => `${id}`).join(", ")}]
              WHERE fase.programa.creador = type::thing("usuario", "${userId}");
            `;
            break;
          case "nivel":
            ownershipQuery = `
              SELECT id FROM [${ids.map((id) => `${id}`).join(", ")}]
              WHERE proof_point.fase.programa.creador = type::thing("usuario", "${userId}");
            `;
            break;
          case "componente":
            ownershipQuery = `
              SELECT id FROM [${ids.map((id) => `${id}`).join(", ")}]
              WHERE nivel.proof_point.fase.programa.creador = type::thing("usuario", "${userId}");
            `;
            break;
          default:
            throw new BadRequestException(
              `Tipo de tabla no soportado: ${table}`,
            );
        }

        this.logger.debug(
          `Verificando propiedad de ${tableItems.length} elementos de tipo ${table}`,
        );

        const ownershipResult = await this.surrealDb.query<any>(ownershipQuery);
        const ownedRecords = ownershipResult?.[0] || [];

        // Verificar que todos los elementos sean propiedad del usuario
        if (ownedRecords.length !== tableItems.length) {
          this.logger.warn(
            `Usuario ${userId} no tiene permisos sobre algunos elementos de ${table}`,
          );
          throw new ForbiddenException(
            `No tienes permiso para modificar algunos de los elementos solicitados`,
          );
        }
      }

      // Si todas las verificaciones pasaron, construir y ejecutar la transacción
      let tx = "BEGIN TRANSACTION;\n";

      for (const item of items) {
        // Escapar el ID para prevenir inyección SQL
        const escapedId = item.id.replace(/'/g, "\\'");
        tx += `UPDATE ${escapedId} SET orden = ${item.orden};\n`;
      }

      tx += "COMMIT TRANSACTION;";

      this.logger.debug(`Ejecutando transacción de actualización:\n${tx}`);

      // Ejecutar la transacción
      await this.surrealDb.query(tx);

      this.logger.log(
        `Orden actualizado exitosamente para ${items.length} elemento(s)`,
      );

      return {
        success: true,
        updated: items.length,
      };
    } catch (error) {
      this.logger.error(
        "Error al actualizar orden de arquitectura:",
        error,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Error al actualizar el orden de los elementos",
      );
    }
  }

  /**
   * Actualiza los prerequisitos de un proof point.
   * Los prerequisitos son otros proof points que deben completarse antes.
   *
   * Este método es utilizado por el roadmap visual al crear/eliminar conectores.
   *
   * @param proofPointId - ID del proof point (sin el prefijo "proof_point:")
   * @param prerequisitosDto - DTO con el array de IDs de prerequisitos
   * @returns Objeto indicando el éxito de la operación
   */
  async updatePrerequisitos(
    proofPointId: string,
    prerequisitosDto: UpdatePrerequisitosDto,
  ): Promise<{ success: boolean }> {
    try {
      this.logger.log(
        `Actualizando prerequisitos del proof point: ${proofPointId}`,
      );

      // Validar que todos los IDs de prerequisitos tengan el formato correcto
      const invalidIds = prerequisitosDto.prerequisitos.filter(
        (id) => !id || !id.startsWith("proof_point:"),
      );

      if (invalidIds.length > 0) {
        throw new BadRequestException(
          `IDs de prerequisitos inválidos (deben tener formato "proof_point:id"): ${invalidIds.join(", ")}`,
        );
      }

      // Construir el array de record links para SurrealDB
      // SurrealDB validará automáticamente que los records existan
      const prerequisitosArray = prerequisitosDto.prerequisitos.length > 0
        ? `[${prerequisitosDto.prerequisitos.map((id) => `${id}`).join(", ")}]`
        : "[]";

      const query = `
        UPDATE type::thing("proof_point", "${proofPointId}")
        SET prerequisitos = ${prerequisitosArray};
      `;

      this.logger.debug(`Ejecutando query: ${query}`);

      const result = await this.surrealDb.query(query);

      if (!result || result.length === 0 || !result[0] || result[0].length === 0) {
        throw new NotFoundException(
          `Proof point con ID ${proofPointId} no encontrado`,
        );
      }

      this.logger.log(
        `Prerequisitos actualizados exitosamente para proof point: ${proofPointId}`,
      );

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error al actualizar prerequisitos del proof point ${proofPointId}:`,
        error,
      );

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        "Error al actualizar los prerequisitos del proof point",
      );
    }
  }

  /**
   * Escapa caracteres especiales en strings para SurrealQL
   */
  private escapeSql(str: string): string {
    if (!str) return "";
    return str.replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r");
  }

  /**
   * Sanitiza IDs para usarlos como nombres de variables en SurrealQL
   */
  private sanitizeId(id: string): string {
    return id.replace(/[^a-zA-Z0-9_]/g, "_");
  }
}
