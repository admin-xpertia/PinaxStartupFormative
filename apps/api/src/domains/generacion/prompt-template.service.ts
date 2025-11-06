import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { SurrealDbService } from "src/core/database";
import {
  CrearPromptTemplateDto,
  ActualizarPromptTemplateDto,
  BuscarPromptTemplatesDto,
} from "./dto";

@Injectable()
export class PromptTemplateService {
  private readonly logger = new Logger(PromptTemplateService.name);

  constructor(private readonly surrealDb: SurrealDbService) {}

  /**
   * Crea una nueva plantilla de prompt.
   *
   * Las plantillas permiten a los instructores guardar y reutilizar prompts
   * que han funcionado bien para generar contenido.
   */
  async crearPlantilla(dto: CrearPromptTemplateDto, userId: string) {
    const {
      nombre,
      descripcion,
      tipoComponente,
      promptTemplate,
      configDefault,
      autor,
      esOficial,
    } = dto;

    // Validar que el prompt tenga variables válidas
    this.validarVariablesPrompt(promptTemplate);

    const query = `
      CREATE prompt_template CONTENT {
        nombre: $nombre,
        descripcion: $descripcion,
        tipo_componente: $tipoComponente,
        prompt_template: $promptTemplate,
        config_default: $configDefault,
        autor: $autor,
        es_oficial: $esOficial,
        creador: type::thing("user", $userId)
      }
      RETURN *;
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      nombre,
      descripcion,
      tipoComponente,
      promptTemplate,
      configDefault: configDefault || {},
      autor: autor || "Desconocido",
      esOficial: esOficial || false,
      userId: this.extractId(userId),
    });

    const plantilla = result?.[0];

    if (!plantilla || !plantilla.id) {
      throw new BadRequestException("No se pudo crear la plantilla");
    }

    this.logger.log(
      `Plantilla de prompt creada: ${nombre} (ID: ${plantilla.id})`,
    );

    return plantilla;
  }

  /**
   * Obtiene todas las plantillas o filtra por tipo de componente.
   */
  async buscarPlantillas(filtros: BuscarPromptTemplatesDto = {}) {
    const { tipoComponente, esOficial } = filtros;

    let query = "SELECT * FROM prompt_template";
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    if (tipoComponente) {
      conditions.push("tipo_componente = $tipoComponente");
      params.tipoComponente = tipoComponente;
    }

    if (esOficial !== undefined) {
      conditions.push("es_oficial = $esOficial");
      params.esOficial = esOficial;
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    query += " ORDER BY created_at DESC;";

    const plantillas = await this.surrealDb.query<any[]>(query, params);

    return plantillas || [];
  }

  /**
   * Obtiene una plantilla por su ID.
   */
  async obtenerPlantilla(plantillaId: string) {
    const query = `
      SELECT * FROM type::thing("prompt_template", $plantillaId);
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      plantillaId: this.extractId(plantillaId),
    });

    const plantilla = result?.[0];

    if (!plantilla) {
      throw new NotFoundException(`Plantilla ${plantillaId} no encontrada`);
    }

    return plantilla;
  }

  /**
   * Actualiza una plantilla existente.
   *
   * IMPORTANTE: Solo el creador o un admin puede actualizar la plantilla.
   * Las plantillas oficiales (es_oficial = true) solo pueden ser actualizadas por admins.
   */
  async actualizarPlantilla(
    plantillaId: string,
    dto: ActualizarPromptTemplateDto,
    userId: string,
  ) {
    const plantilla = await this.obtenerPlantilla(plantillaId);

    // TODO: Implementar verificación de permisos
    // if (plantilla.es_oficial && !esAdmin(userId)) {
    //   throw new ForbiddenException('Solo los admins pueden editar plantillas oficiales');
    // }

    const { nombre, descripcion, promptTemplate, configDefault, autor } = dto;

    // Validar variables si se proporciona un nuevo prompt
    if (promptTemplate) {
      this.validarVariablesPrompt(promptTemplate);
    }

    const query = `
      UPDATE type::thing("prompt_template", $plantillaId)
      SET
        nombre = $nombre ?? nombre,
        descripcion = $descripcion ?? descripcion,
        prompt_template = $promptTemplate ?? prompt_template,
        config_default = $configDefault ?? config_default,
        autor = $autor ?? autor
      RETURN *;
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      plantillaId: this.extractId(plantillaId),
      nombre: nombre || null,
      descripcion: descripcion || null,
      promptTemplate: promptTemplate || null,
      configDefault: configDefault || null,
      autor: autor || null,
    });

    this.logger.log(`Plantilla ${plantillaId} actualizada exitosamente`);

    return result?.[0];
  }

  /**
   * Elimina una plantilla.
   *
   * IMPORTANTE: Solo el creador o un admin puede eliminar la plantilla.
   * Las plantillas oficiales no pueden ser eliminadas.
   */
  async eliminarPlantilla(plantillaId: string, userId: string) {
    const plantilla = await this.obtenerPlantilla(plantillaId);

    if (plantilla.es_oficial) {
      throw new BadRequestException(
        "Las plantillas oficiales no pueden ser eliminadas",
      );
    }

    // TODO: Implementar verificación de permisos
    // if (plantilla.creador !== userId && !esAdmin(userId)) {
    //   throw new ForbiddenException('Solo el creador puede eliminar esta plantilla');
    // }

    const query = `
      DELETE type::thing("prompt_template", $plantillaId);
    `;

    await this.surrealDb.query(query, {
      plantillaId: this.extractId(plantillaId),
    });

    this.logger.log(`Plantilla ${plantillaId} eliminada exitosamente`);

    return {
      mensaje: "Plantilla eliminada exitosamente",
      plantillaId,
    };
  }

  /**
   * Renderiza una plantilla reemplazando las variables con valores reales.
   *
   * Variables soportadas:
   * - {{ programa_nombre }}
   * - {{ fase_nombre }}
   * - {{ proof_point_nombre }}
   * - {{ nivel_nombre }}
   * - {{ componente_nombre }}
   * - etc.
   */
  async renderizarPlantilla(
    plantillaId: string,
    variables: Record<string, any>,
  ): Promise<string> {
    const plantilla = await this.obtenerPlantilla(plantillaId);

    let promptRenderizado = plantilla.prompt_template;

    // Reemplazar cada variable
    for (const [clave, valor] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${clave}\\s*}}`, "g");
      promptRenderizado = promptRenderizado.replace(regex, String(valor));
    }

    // Verificar que no queden variables sin reemplazar
    const variablesSinReemplazar = this.extraerVariables(promptRenderizado);

    if (variablesSinReemplazar.length > 0) {
      this.logger.warn(
        `Variables sin reemplazar en plantilla ${plantillaId}: ${variablesSinReemplazar.join(", ")}`,
      );
    }

    return promptRenderizado;
  }

  /**
   * Clona una plantilla existente para que el usuario pueda modificarla.
   */
  async clonarPlantilla(
    plantillaId: string,
    userId: string,
    nuevoNombre?: string,
  ) {
    const plantillaOriginal = await this.obtenerPlantilla(plantillaId);

    const dto: CrearPromptTemplateDto = {
      nombre: nuevoNombre || `Copia de ${plantillaOriginal.nombre}`,
      descripcion: plantillaOriginal.descripcion,
      tipoComponente: plantillaOriginal.tipo_componente,
      promptTemplate: plantillaOriginal.prompt_template,
      configDefault: plantillaOriginal.config_default,
      autor: plantillaOriginal.autor,
      esOficial: false, // Las copias nunca son oficiales
    };

    return this.crearPlantilla(dto, userId);
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  /**
   * Valida que el prompt tenga variables con la sintaxis correcta {{ variable }}.
   * También verifica que no haya variables duplicadas o malformadas.
   */
  private validarVariablesPrompt(prompt: string) {
    // Buscar variables con sintaxis incorrecta
    const variablesMalformadas = prompt.match(/\{[^{]|[^}]\}/g);

    if (variablesMalformadas) {
      throw new BadRequestException(
        `El prompt tiene variables malformadas. Usa la sintaxis {{ variable }}.`,
      );
    }

    // Extraer todas las variables
    const variables = this.extraerVariables(prompt);

    this.logger.debug(
      `Variables encontradas en el prompt: ${variables.join(", ")}`,
    );
  }

  /**
   * Extrae todas las variables del prompt en formato {{ variable }}.
   */
  private extraerVariables(prompt: string): string[] {
    const regex = /\{\{\s*(\w+)\s*\}\}/g;
    const variables: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = regex.exec(prompt)) !== null) {
      variables.push(match[1]);
    }

    return [...new Set(variables)]; // Eliminar duplicados
  }

  private extractId(recordId: string): string {
    if (!recordId) {
      throw new BadRequestException("ID inválido");
    }

    const parts = recordId.split(":");
    return parts.length > 1 ? parts[parts.length - 1] : recordId;
  }
}
