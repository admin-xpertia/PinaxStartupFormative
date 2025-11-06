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
  UpdateFaseDocDto,
} from "./dto";
import { ProgramVersionDto } from "./dto/program-version.dto";
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

    const { nombre_programa, descripcion, duracion_semanas, fases } = data;

    try {
      this.logger.log(
        `Creando programa "${nombre_programa}" para usuario ${creatorId}`,
      );

      // Limpiar el creatorId si ya incluye el prefijo "user:"
      const cleanCreatorId = this.cleanRecordId(creatorId, "user");

      // 1. Crear el Programa usando query directo en lugar de db.create()
      this.logger.debug(`Creando programa para ${creatorId}`);

      const datosPrograma = {
        nombre: nombre_programa,
        descripcion: descripcion,
        duracion_semanas: duracion_semanas,
        creador: `user:${cleanCreatorId}`,
      };

      this.logger.debug(
        `Datos a enviar: ${JSON.stringify(datosPrograma, null, 2)}`,
      );

      // Usar query directa con SurrealQL en lugar de db.create()
      const createQuery = `
        CREATE programa CONTENT {
          nombre: $nombre,
          descripcion: $descripcion,
          duracion_semanas: $duracion_semanas,
          creador: type::thing('user', $creadorId)
        }
      `;

      this.logger.debug(`Ejecutando query: ${createQuery}`);
      this.logger.debug(
        `Variables: ${JSON.stringify(
          {
            nombre: nombre_programa,
            descripcion: descripcion,
            duracion_semanas: duracion_semanas,
            creadorId: cleanCreatorId,
          },
          null,
          2,
        )}`,
      );

      let programa: any;
      try {
        const result = await this.surrealDb.query<any[]>(createQuery, {
          nombre: nombre_programa,
          descripcion: descripcion,
          duracion_semanas: duracion_semanas,
          creadorId: cleanCreatorId,
        });

        this.logger.debug(
          `Resultado raw de query: ${JSON.stringify(result, null, 2)}`,
        );
        programa = result;
      } catch (createError) {
        this.logger.error(`Error al crear programa: ${createError.message}`);
        this.logger.error(`Stack: ${createError.stack}`);
        throw createError;
      }

      this.logger.debug(
        `Programa después de query: ${JSON.stringify(programa, null, 2)}`,
      );

      if (!programa || (Array.isArray(programa) && programa.length === 0)) {
        throw new InternalServerErrorException(
          "No se pudo crear el programa - respuesta vacía",
        );
      }

      // El wrapper de query ya extrae el resultado, así que programa debería ser el objeto o array directamente
      const programaData = Array.isArray(programa) ? programa[0] : programa;

      if (!programaData || !programaData.id) {
        throw new InternalServerErrorException(
          "No se pudo crear el programa - sin ID",
        );
      }

      this.logger.debug(`Programa creado: ${programaData.id}`);

      const db = this.surrealDb.getDb();

      // 2. Crear las Fases
      for (let i = 0; i < fases.length; i++) {
        const fase = fases[i];

        const objetivosAprendizaje = fase.objetivos_aprendizaje
          ? [fase.objetivos_aprendizaje]
          : [];

        this.logger.debug(`Creando fase ${i + 1}: ${fase.nombre_fase}`);

        const faseResult: any = await db.create("fase", {
          numero_fase: i + 1,
          nombre: fase.nombre_fase,
          descripcion: fase.descripcion_fase,
          objetivos_aprendizaje: objetivosAprendizaje,
          duracion_semanas_estimada: fase.duracion_semanas_fase,
          orden: i,
          programa: programaData.id,
        });

        const faseCreada = Array.isArray(faseResult)
          ? faseResult[0]
          : faseResult;

        if (!faseCreada || !faseCreada.id) {
          throw new InternalServerErrorException(
            `No se pudo crear la fase: ${fase.nombre_fase}`,
          );
        }

        this.logger.debug(`Fase creada: ${faseCreada.id}`);

        // 3. Crear los ProofPoints de cada Fase
        for (let j = 0; j < fase.proof_points.length; j++) {
          const pp = fase.proof_points[j];

          this.logger.debug(`Creando proof point ${j + 1}: ${pp.nombre_pp}`);

          const ppResult: any = await db.create("proof_point", {
            nombre: pp.nombre_pp,
            slug: pp.slug_pp,
            descripcion: pp.descripcion_pp,
            pregunta_central: pp.pregunta_central,
            tipo_entregable_final: pp.tipo_entregable,
            orden_en_fase: j,
            prerequisitos: pp.prerequisitos || [],
            duracion_estimada_horas: pp.duracion_estimada_horas,
            fase: faseCreada.id,
          });

          const ppCreado = Array.isArray(ppResult) ? ppResult[0] : ppResult;

          if (!ppCreado || !ppCreado.id) {
            throw new InternalServerErrorException(
              `No se pudo crear el proof point: ${pp.nombre_pp}`,
            );
          }

          this.logger.debug(`Proof point creado: ${ppCreado.id}`);

          // 4. Crear Niveles placeholder para cada ProofPoint
          // Calcular duración estimada por componente basado en las horas del proof point
          // Distribución: dividir las horas entre (numero_niveles * componentes_por_nivel)
          // Asumimos 1 componente por nivel inicialmente
          const horasPorNivel = pp.duracion_estimada_horas / pp.numero_niveles;
          const minutosPorComponente = Math.round(horasPorNivel * 60); // Convertir horas a minutos

          for (let k = 0; k < pp.numero_niveles; k++) {
            const nivelNumero = k + 1;

            this.logger.debug(
              `Creando nivel ${nivelNumero} para proof point ${ppCreado.id}`,
            );

            const nivelResult: any = await db.create("nivel", {
              numero_nivel: nivelNumero,
              nombre: `Nivel ${nivelNumero}`,
              objetivo_especifico: "Objetivo pendiente de definir",
              criterio_completacion: { logica: "AND", reglas: [] },
              proof_point: ppCreado.id,
            });

            const nivelCreado = Array.isArray(nivelResult)
              ? nivelResult[0]
              : nivelResult;

            if (!nivelCreado || !nivelCreado.id) {
              throw new InternalServerErrorException(
                `No se pudo crear el nivel ${nivelNumero}`,
              );
            }

            this.logger.debug(`Nivel creado: ${nivelCreado.id}`);

            // Crear componente placeholder con duración calculada
            const componenteResult: any = await db.create("componente", {
              nombre: "Lección (pendiente)",
              descripcion_breve: "",
              tipo: "leccion",
              orden: 1,
              duracion_estimada_minutos: minutosPorComponente || 30, // Fallback a 30 minutos si el cálculo da 0
              nivel: nivelCreado.id,
            });

            const componenteCreado = Array.isArray(componenteResult)
              ? componenteResult[0]
              : componenteResult;

            if (!componenteCreado || !componenteCreado.id) {
              throw new InternalServerErrorException(
                `No se pudo crear el componente para nivel ${nivelNumero}`,
              );
            }

            this.logger.debug(`Componente creado: ${componenteCreado.id}`);
          }
        }
      }

      this.logger.log(
        `Programa creado exitosamente: ${programaData.id} - ${programaData.nombre}`,
      );

      return programaData as ProgramaCreado;
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
   * Incluye estadísticas calculadas para cada programa
   */
  async findAllByCreator(creatorId: string | null): Promise<any[]> {
    if (!creatorId) {
      return [];
    }

    try {
      // Limpiar el creatorId si ya incluye el prefijo "user:"
      const cleanCreatorId = this.cleanRecordId(creatorId, "user");

      // Query que incluye estadísticas calculadas
      const query = `
        SELECT *,
          (SELECT count() FROM fase WHERE programa = $parent.id GROUP ALL)[0] AS total_fases,
          (SELECT count() FROM proof_point WHERE fase.programa = $parent.id GROUP ALL)[0] AS total_proof_points,
          (SELECT count() FROM cohorte WHERE programa = $parent.id AND activo = true GROUP ALL)[0] AS cohortes_activas,
          (SELECT count() FROM cohorte WHERE programa = $parent.id GROUP ALL)[0] AS total_cohortes
        FROM programa
        WHERE creador = type::thing("user", "${cleanCreatorId}")
        ORDER BY created_at DESC;
      `;

      const result = await this.surrealDb.query<any[]>(query);

      // Transformar los resultados para incluir estadísticas formateadas
      const programas = (result || []).map(programa => ({
        ...programa,
        estadisticas: {
          fases: `${programa.total_fases || 0} fases`,
          proof_points: `${programa.total_proof_points || 0} proof points`,
          duracion: `${programa.duracion_semanas || 0} semanas`,
          estudiantes: programa.cohortes_activas > 0
            ? `${programa.cohortes_activas} cohorte${programa.cohortes_activas !== 1 ? 's' : ''} activa${programa.cohortes_activas !== 1 ? 's' : ''}`
            : '0 estudiantes'
        }
      }));

      return programas;
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

      // Limpiar el ID si incluye el prefijo "programa:"
      const cleanProgramaId = programaId.includes(":")
        ? programaId.split(":")[1]
        : programaId;

      const programaRecordId = `type::thing("programa", "${cleanProgramaId}")`;

      // Query compuesta para obtener programa y todas sus relaciones
      // Como las relaciones están definidas en dirección inversa (fase->programa, no programa->fase),
      // necesitamos hacer queries separadas y luego unirlas
      const query = `
        LET $programa = (SELECT * FROM ${programaRecordId})[0];

        LET $fases = SELECT *,
          (SELECT * FROM proof_point WHERE fase = $parent.id ORDER BY orden, created_at) AS proof_points
        FROM fase
        WHERE programa = ${programaRecordId}
        ORDER BY orden, created_at;

        -- Para cada proof point, obtener sus niveles
        LET $proof_points = SELECT *,
          (SELECT * FROM nivel WHERE proof_point = $parent.id ORDER BY numero_nivel) AS niveles
        FROM proof_point
        WHERE fase.programa = ${programaRecordId};

        -- Para cada nivel, obtener sus componentes
        LET $niveles = SELECT *,
          (SELECT * FROM componente WHERE nivel = $parent.id ORDER BY orden, created_at) AS componentes
        FROM nivel
        WHERE proof_point.fase.programa = ${programaRecordId};

        -- Retornar el programa con sus fases embebidas
        RETURN {
          id: $programa.id,
          nombre: $programa.nombre,
          descripcion: $programa.descripcion,
          duracion_semanas: $programa.duracion_semanas,
          creador: $programa.creador,
          created_at: $programa.created_at,
          updated_at: $programa.updated_at,
          fases: $fases
        };
      `;

      this.logger.debug(`Ejecutando query compuesta`);

      const result = await this.surrealDb.query<any[]>(query);
      this.logger.debug(`Query result: ${JSON.stringify(result)}`);

      // El resultado de una query con RETURN es el valor retornado directamente
      const programa = Array.isArray(result) && result.length > 0 ? result[result.length - 1] : null;

      if (!programa) {
        throw new NotFoundException(
          `Programa con ID ${programaId} no encontrado`,
        );
      }

      // Asegurar que fases sea un array (la query ya lo debe proveer)
      if (!programa.fases || !Array.isArray(programa.fases)) {
        programa.fases = [];
      }

      // La query ya trae todo anidado y ordenado correctamente,
      // solo necesitamos asegurar que los arrays anidados existan
      for (const fase of programa.fases) {
        if (!fase.proof_points || !Array.isArray(fase.proof_points)) {
          fase.proof_points = [];
        }

        for (const proofPoint of fase.proof_points) {
          if (!proofPoint.niveles || !Array.isArray(proofPoint.niveles)) {
            proofPoint.niveles = [];
          }

          for (const nivel of proofPoint.niveles) {
            if (!nivel.componentes || !Array.isArray(nivel.componentes)) {
              nivel.componentes = [];
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
   * Obtiene la documentación guardada para una fase específica.
   * Si no existe un registro se retorna null para que el frontend inicialice un borrador vacío.
   */
  async getDocumentacion(faseId: string) {
    const { plain, record } = this.normalizeFaseId(faseId);

    try {
      this.logger.log(`Obteniendo documentación de la fase ${record}`);

      const query = `
        SELECT *,
               id::string(fase) AS fase_ref,
               fase.nombre AS fase_nombre
        FROM fase_documentation
        WHERE fase = type::thing("fase", $faseId);
      `;

      const result = await this.surrealDb.query<any[]>(query, {
        faseId: plain,
      });

      const docRecord = result?.[0];

      if (!docRecord) {
        this.logger.debug(
          `La fase ${record} no tiene documentación registrada todavía`,
        );
        return null;
      }

      return this.mapDocumentacionRecord(docRecord, plain);
    } catch (error) {
      this.logger.error(
        `Error al obtener la documentación de la fase ${record}:`,
        error,
      );
      throw new InternalServerErrorException(
        "Error al obtener la documentación de la fase",
      );
    }
  }

  /**
   * Actualiza (o crea si no existe) la documentación de una fase.
   */
  async updateDocumentacion(faseId: string, data: UpdateFaseDocDto) {
    const { plain, record } = this.normalizeFaseId(faseId);

    if (data.fase_id && !this.isSameFaseId(data.fase_id, record)) {
      throw new BadRequestException(
        "El ID de la fase en el cuerpo no coincide con el parámetro de la ruta",
      );
    }

    const vars = {
      faseId: plain,
      contexto: data.contexto,
      conceptos: data.conceptos_clave ?? [],
      casos: data.casos_estudio ?? [],
      errores: data.errores_comunes ?? [],
      recursos: data.recursos_referencia ?? [],
      criterios: this.transformCriteriosForStorage(
        data.criterios_evaluacion ?? [],
      ),
    };

    try {
      this.logger.log(`Guardando documentación de la fase ${record}`);

      const updateQuery = `
        UPDATE fase_documentation
        SET contexto_general = $contexto,
            conceptos_clave = $conceptos,
            casos_ejemplo = $casos,
            errores_comunes = $errores,
            recursos_referencia = $recursos,
            criterios_evaluacion = $criterios,
            updated_at = time::now()
        WHERE fase = type::thing("fase", $faseId)
        RETURN *;
      `;

      const updateResult = await this.surrealDb.query<any[]>(updateQuery, vars);
      let docRecord = updateResult?.[0];

      if (!docRecord) {
        this.logger.debug(
          `No existía documentación previa para la fase ${record}, creando nueva entrada`,
        );

        const createQuery = `
          CREATE fase_documentation CONTENT {
            fase: type::thing("fase", $faseId),
            contexto_general: $contexto,
            conceptos_clave: $conceptos,
            casos_ejemplo: $casos,
            errores_comunes: $errores,
            recursos_referencia: $recursos,
            criterios_evaluacion: $criterios,
            updated_at: time::now()
          }
          RETURN *;
        `;

        const createResult = await this.surrealDb.query<any[]>(
          createQuery,
          vars,
        );
        docRecord = createResult?.[0];
      }

      if (!docRecord) {
        throw new InternalServerErrorException(
          "No se pudo guardar la documentación de la fase",
        );
      }

      return await this.getDocumentacion(record);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      this.logger.error(
        `Error al actualizar la documentación de la fase ${record}:`,
        error,
      );
      throw new InternalServerErrorException(
        "Error al guardar la documentación de la fase",
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

      // Limpiar el userId si incluye el prefijo "user:"
      const cleanUserId = this.cleanRecordId(userId, "user");

      // Verificar propiedad para cada tipo de tabla
      for (const [table, tableItems] of Object.entries(itemsByTable)) {
        const ids = tableItems.map((item) => item.id);
        let ownershipQuery: string;

        // Construir la query de verificación según el tipo de tabla
        switch (table) {
          case "programa":
            ownershipQuery = `
              SELECT id FROM [${ids.map((id) => `${id}`).join(", ")}]
              WHERE creador = type::thing("user", "${cleanUserId}");
            `;
            break;
          case "fase":
            ownershipQuery = `
              SELECT id FROM [${ids.map((id) => `${id}`).join(", ")}]
              WHERE programa.creador = type::thing("user", "${cleanUserId}");
            `;
            break;
          case "proof_point":
            ownershipQuery = `
              SELECT id FROM [${ids.map((id) => `${id}`).join(", ")}]
              WHERE fase.programa.creador = type::thing("user", "${cleanUserId}");
            `;
            break;
          case "nivel":
            ownershipQuery = `
              SELECT id FROM [${ids.map((id) => `${id}`).join(", ")}]
              WHERE proof_point.fase.programa.creador = type::thing("user", "${cleanUserId}");
            `;
            break;
          case "componente":
            ownershipQuery = `
              SELECT id FROM [${ids.map((id) => `${id}`).join(", ")}]
              WHERE nivel.proof_point.fase.programa.creador = type::thing("user", "${cleanUserId}");
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
      this.logger.error("Error al actualizar orden de arquitectura:", error);

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
      const prerequisitosArray =
        prerequisitosDto.prerequisitos.length > 0
          ? `[${prerequisitosDto.prerequisitos.map((id) => `${id}`).join(", ")}]`
          : "[]";

      const query = `
        UPDATE type::thing("proof_point", "${proofPointId}")
        SET prerequisitos = ${prerequisitosArray};
      `;

      this.logger.debug(`Ejecutando query: ${query}`);

      const result = await this.surrealDb.query(query);

      if (
        !result ||
        result.length === 0 ||
        !result[0] ||
        result[0].length === 0
      ) {
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

  /**
   * Limpia el prefijo de tabla de un ID si está presente
   * Ejemplo: "user:abc123" -> "abc123"
   */
  private cleanRecordId(id: string, table: string): string {
    if (!id) return id;
    const prefix = `${table}:`;
    return id.startsWith(prefix) ? id.substring(prefix.length) : id;
  }

  /**
   * Normaliza el ID de la fase aceptando valores con o sin prefijo SurrealDB.
   */
  private normalizeFaseId(faseId: string): { plain: string; record: string } {
    if (!faseId || typeof faseId !== "string") {
      throw new BadRequestException("ID de fase inválido");
    }

    const trimmed = faseId.trim();
    if (!trimmed) {
      throw new BadRequestException("ID de fase inválido");
    }

    const parts = trimmed.split(":");
    const plain = parts.length > 1 ? parts[parts.length - 1] : trimmed;

    return { plain, record: `fase:${plain}` };
  }

  private isSameFaseId(faseIdFromBody: string, faseRecordId: string): boolean {
    const normalized = this.normalizeFaseId(faseIdFromBody);
    return normalized.record === faseRecordId;
  }

  private transformCriteriosForStorage(criterios: any[]) {
    return {
      items: Array.isArray(criterios) ? criterios : [],
    };
  }

  private mapDocumentacionRecord(record: any, fallbackPlainId: string) {
    const faseRef =
      typeof record?.fase_ref === "string"
        ? record.fase_ref
        : typeof record?.fase === "string"
          ? record.fase
          : record?.fase?.id;

    const fasePlain = faseRef
      ? (faseRef.split(":").pop() ?? fallbackPlainId)
      : fallbackPlainId;

    const faseNombre =
      typeof record?.fase_nombre === "string"
        ? record.fase_nombre
        : typeof record?.fase === "object" && record?.fase !== null
          ? record.fase.nombre
          : null;

    const conceptos = Array.isArray(record?.conceptos_clave)
      ? record.conceptos_clave
      : [];
    const casos = Array.isArray(record?.casos_ejemplo)
      ? record.casos_ejemplo
      : [];
    const errores = Array.isArray(record?.errores_comunes)
      ? record.errores_comunes
      : [];
    const recursos = Array.isArray(record?.recursos_referencia)
      ? record.recursos_referencia
      : [];

    let criterios: any[] = [];
    if (Array.isArray(record?.criterios_evaluacion)) {
      criterios = record.criterios_evaluacion;
    } else if (
      record?.criterios_evaluacion &&
      typeof record.criterios_evaluacion === "object" &&
      Array.isArray(record.criterios_evaluacion.items)
    ) {
      criterios = record.criterios_evaluacion.items;
    }

    const contexto = record?.contexto_general ?? "";
    const completitud = this.calculateDocumentacionCompleteness({
      contexto,
      conceptos_clave: conceptos,
      casos_estudio: casos,
      errores_comunes: errores,
      recursos_referencia: recursos,
      criterios_evaluacion: criterios,
    });

    return {
      fase_id: fasePlain,
      contexto,
      conceptos_clave: conceptos,
      casos_estudio: casos,
      errores_comunes: errores,
      recursos_referencia: recursos,
      criterios_evaluacion: criterios,
      completitud,
      fase_nombre: faseNombre ?? undefined,
    };
  }

  private calculateDocumentacionCompleteness(doc: {
    contexto: string;
    conceptos_clave: any[];
    casos_estudio: any[];
    errores_comunes: any[];
    recursos_referencia: any[];
    criterios_evaluacion: any[];
  }): number {
    const totalChecks = 6;
    let score = 0;

    if (doc.contexto && doc.contexto.length >= 200) {
      score += 1;
    }
    if (doc.conceptos_clave && doc.conceptos_clave.length >= 3) {
      score += 1;
    }
    if (doc.casos_estudio && doc.casos_estudio.length >= 2) {
      score += 1;
    }
    if (doc.errores_comunes && doc.errores_comunes.length >= 2) {
      score += 1;
    }
    if (doc.criterios_evaluacion && doc.criterios_evaluacion.length >= 3) {
      score += 1;
    }
    if (doc.recursos_referencia && doc.recursos_referencia.length >= 1) {
      score += 1;
    }

    return Math.round((score / totalChecks) * 100);
  }

  /**
   * Obtiene las versiones disponibles de un programa.
   *
   * MVP: Por ahora solo devolvemos la versión actual (1.0)
   * TODO: Implementar sistema completo de versionamiento con:
   * - Tabla de versiones en DB
   * - Snapshot de arquitectura por versión
   * - Historial de cambios
   * - Cohortes usando cada versión
   */
  async getVersiones(programaId: string): Promise<ProgramVersionDto[]> {
    try {
      // Obtener datos básicos del programa
      const query = `SELECT * FROM type::thing("programa", "${programaId}")`;
      const result = await this.surrealDb.query<any>(query);
      const programa = result?.[0]?.[0];

      if (!programa) {
        throw new NotFoundException(
          `Programa con ID ${programaId} no encontrado`,
        );
      }

      // Query para contar cuántas cohortes usan este programa
      const cohorteQuery = `
        SELECT count() as total FROM cohorte
        WHERE programa = type::thing("programa", "${programaId}")
        GROUP ALL
      `;
      const cohorteResult = await this.surrealDb.query<any>(cohorteQuery);
      const cohortesUsando = cohorteResult?.[0]?.[0]?.total || 0;

      // Por ahora, devolver solo la versión actual (MVP)
      const version: ProgramVersionDto = {
        version: "1.0",
        estado: "actual",
        fecha: programa.created_at || new Date().toISOString(),
        cambios: ["Versión inicial del programa"],
        cohortes_usando: cohortesUsando,
        recomendada: true,
      };

      return [version];
    } catch (error) {
      this.logger.error(
        `Error getting versions for programa ${programaId}:`,
        error,
      );
      throw new InternalServerErrorException(
        "Error al obtener versiones del programa",
      );
    }
  }

  /**
   * Obtiene la información básica de un programa por su ID
   * @param programaId - ID del programa (sin el prefijo "programa:")
   * @returns Datos básicos del programa con estadísticas
   */
  async findById(programaId: string): Promise<any> {
    try {
      this.logger.log(`Obteniendo programa: ${programaId}`);

      // Limpiar el ID si incluye el prefijo "programa:"
      const cleanProgramaId = programaId.includes(":")
        ? programaId.split(":")[1]
        : programaId;

      // Query que incluye estadísticas calculadas
      const query = `
        SELECT *,
          (SELECT count() FROM fase WHERE programa = $parent.id GROUP ALL)[0] AS total_fases,
          (SELECT count() FROM proof_point WHERE fase.programa = $parent.id GROUP ALL)[0] AS total_proof_points,
          (SELECT count() FROM cohorte WHERE programa = $parent.id AND activo = true GROUP ALL)[0] AS cohortes_activas,
          (SELECT count() FROM cohorte WHERE programa = $parent.id GROUP ALL)[0] AS total_cohortes
        FROM type::thing("programa", "${cleanProgramaId}");
      `;

      const result = await this.surrealDb.query<any[]>(query);
      const programa = Array.isArray(result) && result.length > 0 ? result[0] : null;

      if (!programa) {
        throw new NotFoundException(
          `Programa con ID ${programaId} no encontrado`,
        );
      }

      // Log para debug
      this.logger.debug(`Programa raw data:`, JSON.stringify(programa, null, 2));
      this.logger.debug(`total_fases type: ${typeof programa.total_fases}, value:`, programa.total_fases);
      this.logger.debug(`total_proof_points type: ${typeof programa.total_proof_points}, value:`, programa.total_proof_points);

      // Extraer valores numéricos de los objetos de SurrealDB si es necesario
      const getTotalFases = () => {
        if (typeof programa.total_fases === 'number') return programa.total_fases;
        if (typeof programa.total_fases === 'object' && programa.total_fases !== null) {
          return programa.total_fases.count || programa.total_fases.value || 0;
        }
        return 0;
      };

      const getTotalProofPoints = () => {
        if (typeof programa.total_proof_points === 'number') return programa.total_proof_points;
        if (typeof programa.total_proof_points === 'object' && programa.total_proof_points !== null) {
          return programa.total_proof_points.count || programa.total_proof_points.value || 0;
        }
        return 0;
      };

      const getCohortesActivas = () => {
        if (typeof programa.cohortes_activas === 'number') return programa.cohortes_activas;
        if (typeof programa.cohortes_activas === 'object' && programa.cohortes_activas !== null) {
          return programa.cohortes_activas.count || programa.cohortes_activas.value || 0;
        }
        return 0;
      };

      const totalFases = getTotalFases();
      const totalProofPoints = getTotalProofPoints();
      const cohortesActivas = getCohortesActivas();

      this.logger.debug(`Extracted values - fases: ${totalFases}, proof_points: ${totalProofPoints}, cohortes: ${cohortesActivas}`);

      // Transformar los resultados para incluir estadísticas formateadas
      const programaConEstadisticas = {
        ...programa,
        estadisticas: {
          fases: `${totalFases} fases`,
          proof_points: `${totalProofPoints} proof points`,
          duracion: `${programa.duracion_semanas || 0} semanas`,
          estudiantes: cohortesActivas > 0
            ? `${cohortesActivas} cohorte${cohortesActivas !== 1 ? 's' : ''} activa${cohortesActivas !== 1 ? 's' : ''}`
            : '0 estudiantes'
        }
      };

      return programaConEstadisticas;
    } catch (error) {
      this.logger.error(
        `Error al obtener programa ${programaId}:`,
        error,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        "No se pudo obtener el programa",
      );
    }
  }

  /**
   * Actualiza la información básica de un programa
   * @param programaId - ID del programa (sin el prefijo "programa:")
   * @param updateData - Datos a actualizar
   * @returns Programa actualizado
   */
  async update(programaId: string, updateData: any): Promise<any> {
    try {
      this.logger.log(`Actualizando programa: ${programaId}`);

      // Limpiar el ID si incluye el prefijo "programa:"
      const cleanProgramaId = programaId.includes(":")
        ? programaId.split(":")[1]
        : programaId;

      // Verificar que el programa existe
      const programaExistente = await this.findById(cleanProgramaId);
      if (!programaExistente) {
        throw new NotFoundException(
          `Programa con ID ${programaId} no encontrado`,
        );
      }

      // Construir el objeto de actualización solo con campos definidos
      const camposActualizacion: any = {};

      if (updateData.nombre !== undefined) camposActualizacion.nombre = updateData.nombre;
      if (updateData.descripcion !== undefined) camposActualizacion.descripcion = updateData.descripcion;
      if (updateData.categoria !== undefined) camposActualizacion.categoria = updateData.categoria;
      if (updateData.duracion_semanas !== undefined) camposActualizacion.duracion_semanas = updateData.duracion_semanas;
      if (updateData.nivel_dificultad !== undefined) camposActualizacion.nivel_dificultad = updateData.nivel_dificultad;
      if (updateData.imagen_portada_url !== undefined) camposActualizacion.imagen_portada_url = updateData.imagen_portada_url;
      if (updateData.objetivos_aprendizaje !== undefined) camposActualizacion.objetivos_aprendizaje = updateData.objetivos_aprendizaje;
      if (updateData.prerequisitos !== undefined) camposActualizacion.prerequisitos = updateData.prerequisitos;
      if (updateData.audiencia_objetivo !== undefined) camposActualizacion.audiencia_objetivo = updateData.audiencia_objetivo;
      if (updateData.tags !== undefined) camposActualizacion.tags = updateData.tags;
      if (updateData.visible !== undefined) camposActualizacion.visible = updateData.visible;
      if (updateData.estado !== undefined) camposActualizacion.estado = updateData.estado;

      // Ejecutar update - SurrealDB actualiza updated_at automáticamente si está en el schema
      const query = `
        UPDATE type::thing("programa", "${cleanProgramaId}")
        MERGE $campos;
      `;

      const result = await this.surrealDb.query<any[]>(query, {
        campos: camposActualizacion,
      });

      const programaActualizado = Array.isArray(result) && result.length > 0 ? result[0] : null;

      if (!programaActualizado) {
        throw new InternalServerErrorException(
          "No se pudo actualizar el programa",
        );
      }

      this.logger.log(`Programa ${programaId} actualizado exitosamente`);

      // Devolver el programa actualizado con estadísticas
      return this.findById(cleanProgramaId);
    } catch (error) {
      this.logger.error(
        `Error al actualizar programa ${programaId}:`,
        error,
      );

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        "No se pudo actualizar el programa",
      );
    }
  }
}
