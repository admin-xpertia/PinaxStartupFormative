import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  Inject,
  Logger,
} from "@nestjs/common";
import OpenAI from "openai";
import type { ChatCompletion } from "openai/resources/chat/completions";
import { instanceToPlain } from "class-transformer";
import { SurrealDbService } from "src/core/database";
import { ProgramasService } from "../programas/programas.service";
import { GenerationConfigDto, TipoComponente } from "./dto";
import type { FaseDocumentation } from "@xpertia/types/fase";

export const OPENAI_CLIENT = Symbol("OPENAI_CLIENT");

@Injectable()
export class GeneracionService {
  private readonly logger = new Logger(GeneracionService.name);

  constructor(
    private readonly programasService: ProgramasService,
    private readonly surrealDb: SurrealDbService,
    @Inject(OPENAI_CLIENT) private readonly openai: OpenAI,
  ) {}

  /**
   * Genera contenido asistido por IA para un componente específico.
   */
  async generateContent(config: GenerationConfigDto, userId: string) {
    if (!userId) {
      throw new BadRequestException("Usuario no autenticado");
    }

    const faseDocumentation = await this.programasService.getDocumentacion(
      config.faseId,
    );

    const prompt = this._buildPrompt(config, faseDocumentation);

    const requestRecord = await this.createGeneracionRequest(
      config,
      userId,
      prompt,
    );

    try {
      const response = await this._callOpenAI(prompt, config);
      const parsed = this.parseOpenAIResponse(response);

      // Guardar el contenido generado en contenido_generado
      await this.persistGeneratedContent(requestRecord.id, response, parsed);

      // Guardar en componente_contenido y validacion_calidad con transacción
      const result = await this.saveComponenteContenido(config, parsed);

      await this.markRequestCompleted(requestRecord.id);

      return result;
    } catch (error) {
      this.logger.error("Error durante la generación de contenido:", error);

      await this.markRequestFailed(
        requestRecord?.id,
        error instanceof Error ? error.message : "Error desconocido",
      );

      throw new InternalServerErrorException(
        "No pudimos generar el contenido en este momento",
      );
    }
  }

  private async createGeneracionRequest(
    config: GenerationConfigDto,
    userId: string,
    prompt: string,
  ) {
    const componente = this.normalizeThingId(config.componenteId, "componente");
    const usuario = this.normalizeThingId(userId, "user");

    const configPayload = instanceToPlain(config);

    const query = `
      CREATE generacion_request CONTENT {
        componente: type::thing("componente", $componenteId),
        solicitado_por: type::thing("user", $userId),
        configuracion: $configuracion,
        prompt_usado: $prompt,
        estado: "processing"
      }
      RETURN *;
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      componenteId: componente.plain,
      userId: usuario.plain,
      configuracion: configPayload,
      prompt,
    });

    const record = result?.[0];

    if (!record || !record.id) {
      throw new InternalServerErrorException(
        "No se pudo crear la solicitud de generación",
      );
    }

    return record;
  }

  private async persistGeneratedContent(
    requestId: string,
    response: ChatCompletion,
    parsed: any,
  ) {
    const request = this.normalizeThingId(requestId, "generacion_request");

    const contenidoRaw = JSON.stringify(parsed);
    const metadata = {
      model: response.model,
      usage: response.usage,
    };

    const query = `
      CREATE contenido_generado CONTENT {
        generacion_request: type::thing("generacion_request", $requestId),
        contenido_raw: $contenido,
        metadata: $metadata,
        tokens_usados: $tokens,
        costo_estimado: $costo
      }
      RETURN *;
    `;

    await this.surrealDb.query(query, {
      requestId: request.plain,
      contenido: contenidoRaw,
      metadata,
      tokens: response.usage?.total_tokens ?? 0,
      costo: this.estimateCost(response),
    });
  }

  private async markRequestCompleted(requestId: string) {
    const request = this.normalizeThingId(requestId, "generacion_request");

    const query = `
      UPDATE type::thing("generacion_request", $requestId)
      SET estado = "completed",
          completed_at = time::now()
      RETURN *;
    `;

    await this.surrealDb.query(query, {
      requestId: request.plain,
    });
  }

  private async markRequestFailed(
    requestId: string | undefined,
    message: string,
  ) {
    if (!requestId) {
      return;
    }

    const request = this.normalizeThingId(requestId, "generacion_request");

    const query = `
      UPDATE type::thing("generacion_request", $requestId)
      SET estado = "failed",
          error_message = $message,
          completed_at = time::now()
      RETURN *;
    `;

    await this.surrealDb.query(query, {
      requestId: request.plain,
      message,
    });
  }

  private estimateCost(response: ChatCompletion): number {
    // En una implementación posterior podemos mapear precios por modelo
    const tokens = response.usage?.total_tokens ?? 0;
    const estimatedCostPerToken = 0.00002; // Placeholder: ~0.02 USD por 1k tokens
    return +(tokens * estimatedCostPerToken).toFixed(6);
  }

  /**
   * Guarda el contenido generado en las tablas componente_contenido y validacion_calidad
   * usando una transacción de SurrealDB
   */
  private async saveComponenteContenido(
    config: GenerationConfigDto,
    parsedResponse: any,
  ) {
    const { contenido, analisis_calidad } = parsedResponse;

    // Normalizar el componenteId
    const componente = this.normalizeThingId(config.componenteId, "componente");

    // Construir la transacción
    const queries: string[] = [];

    // 1. Crear la validación de calidad si existe
    if (analisis_calidad) {
      queries.push(`
        LET $validacion = CREATE validacion_calidad CONTENT {
          score_general: ${analisis_calidad.score_general ?? 0},
          metricas: ${JSON.stringify(analisis_calidad.metricas ?? {})},
          sugerencias: ${JSON.stringify(analisis_calidad.sugerencias ?? [])},
          comparacion_objetivos: ${JSON.stringify(analisis_calidad.comparacion_objetivos ?? [])}
        };
      `);

      // 2. Crear el contenido y linkear la validación
      queries.push(`
        LET $contenido = CREATE componente_contenido CONTENT {
          componente: type::thing("componente", "${componente.plain}"),
          tipo: "${config.tipo_componente}",
          contenido: ${JSON.stringify(contenido)},
          estado: 'draft',
          validacion_calidad: $validacion.id
        };
      `);
    } else {
      // Crear contenido sin validación
      queries.push(`
        LET $contenido = CREATE componente_contenido CONTENT {
          componente: type::thing("componente", "${componente.plain}"),
          tipo: "${config.tipo_componente}",
          contenido: ${JSON.stringify(contenido)},
          estado: 'draft'
        };
      `);
    }

    // 3. Actualizar el componente para que apunte a esta nueva versión
    queries.push(`
      UPDATE type::thing("componente", "${componente.plain}")
      SET version_contenido_actual = $contenido.id;
    `);

    // Ejecutar la transacción
    const transactionQuery = `
      BEGIN TRANSACTION;
      ${queries.join('\n')}
      COMMIT TRANSACTION;
      RETURN $contenido;
    `;

    try {
      const result = await this.surrealDb.query<any[]>(transactionQuery);

      // El resultado de la transacción está en el último elemento
      const finalResult = result[result.length - 1];

      this.logger.log(`Contenido guardado exitosamente para componente ${componente.plain}`);

      return {
        contenido,
        analisis_calidad,
        componente_contenido_id: finalResult?.id,
      };
    } catch (error) {
      this.logger.error("Error al guardar contenido en BD:", error);
      throw new InternalServerErrorException(
        "Error al guardar el contenido generado en la base de datos",
      );
    }
  }

  /**
   * Realiza una llamada síncrona a la API de OpenAI.
   * CRÍTICO: Usa response_format: { type: "json_object" } para garantizar JSON válido.
   *
   * @param prompt - El prompt completo construido por _buildPrompt
   * @param config - Configuración de generación (modelo, temperatura, etc.)
   * @returns La respuesta completa de OpenAI
   * @throws InternalServerErrorException si la llamada falla
   */
  private async _callOpenAI(
    prompt: string,
    config: GenerationConfigDto,
  ): Promise<ChatCompletion> {
    const model = config.modelo_ia || "gpt-4o-mini";
    const temperature = config.temperatura ?? 0.7;

    this.logger.log(`Llamando a OpenAI API con modelo: ${model}, temperatura: ${temperature}`);
    this.logger.debug(`Longitud del prompt: ${prompt.length} caracteres (~${Math.ceil(prompt.length / 4)} tokens estimados)`);

    try {
      const response = await this.openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: prompt, // El prompt completo ya incluye el rol y contexto
          },
        ],
        temperature,
        // ¡CRÍTICO! Esta opción garantiza que OpenAI devuelva JSON válido
        response_format: {
          type: "json_object",
        },
        // Opcional: agregar límites si es necesario
        // max_tokens: 4096,
      });

      this.logger.log(`Respuesta recibida de OpenAI. Tokens usados: ${response.usage?.total_tokens || 'N/A'}`);

      return response as ChatCompletion;
    } catch (error: any) {
      this.logger.error("Error al llamar a la API de OpenAI:", error);

      // Manejo específico de errores de OpenAI
      if (error.status === 429) {
        throw new InternalServerErrorException(
          "Límite de tasa de OpenAI alcanzado. Por favor, intenta nuevamente en unos momentos.",
        );
      }

      if (error.status === 401) {
        throw new InternalServerErrorException(
          "Error de autenticación con OpenAI. Verifica la API key.",
        );
      }

      if (error.status === 400) {
        this.logger.error("Prompt que causó el error (primeros 500 chars):", prompt.substring(0, 500));
        throw new InternalServerErrorException(
          "El prompt enviado a OpenAI es inválido. Revisa la configuración.",
        );
      }

      throw new InternalServerErrorException(
        `Error al generar contenido con IA: ${error.message || "Error desconocido"}`,
      );
    }
  }

  /**
   * Parsea la respuesta JSON de OpenAI y valida su estructura.
   *
   * @param response - La respuesta completa de OpenAI
   * @returns El objeto JSON parseado con contenido y analisis_calidad
   * @throws InternalServerErrorException si el JSON es inválido
   */
  private parseOpenAIResponse(response: ChatCompletion): any {
    const output = response.choices?.[0]?.message?.content;

    if (!output) {
      this.logger.error("Respuesta de OpenAI sin contenido:", JSON.stringify(response));
      throw new InternalServerErrorException(
        "La respuesta de OpenAI no contiene contenido procesable",
      );
    }

    this.logger.debug(`Parseando respuesta JSON (${output.length} caracteres)`);

    try {
      const parsed = JSON.parse(output);

      // Validaciones básicas de estructura
      if (typeof parsed !== "object" || parsed === null) {
        throw new Error("El contenido generado no es un objeto JSON válido");
      }

      if (!parsed.contenido) {
        throw new Error("La respuesta no incluye el campo 'contenido'");
      }

      if (!parsed.analisis_calidad) {
        this.logger.warn("La respuesta no incluye 'analisis_calidad'. Se agregará un análisis vacío.");
        parsed.analisis_calidad = {
          score_general: 0,
          metricas: {},
          sugerencias: [],
          comparacion_objetivos: [],
        };
      }

      this.logger.log("Respuesta JSON parseada exitosamente");

      return parsed;
    } catch (error: any) {
      this.logger.error("Error al parsear respuesta de OpenAI:", error.message);
      this.logger.error("Contenido que falló al parsear (primeros 500 chars):", output.substring(0, 500));

      throw new InternalServerErrorException(
        "La IA devolvió un formato inválido. El contenido no pudo ser parseado como JSON válido.",
      );
    }
  }

  /**
   * Construye el prompt completo del sistema para la API de OpenAI.
   * Esta es la "receta secreta" de Xpertia que combina el conocimiento
   * del instructor con las intenciones de generación.
   */
  private _buildPrompt(
    config: GenerationConfigDto,
    doc: FaseDocumentation | null,
  ): string {
    const promptParts: string[] = [];

    // --- 1. EL ROL (Persona) ---
    // Establece la autoridad y el propósito del LLM
    promptParts.push(
      `Eres "Xpertia-AI", un diseñador instruccional experto de clase mundial y un especialista en el dominio de ${config.programa_nombre}. Tu propósito es generar contenido pedagógico que sea transformacional, práctico y esté perfectamente alineado con la metodología de un instructor experto.`,
    );

    // --- 2. EL CONTEXTO JERÁRQUICO (Dónde estamos) ---
    // Le da al LLM la "migaja de pan" de dónde se ubica este contenido
    promptParts.push(
      `# CONTEXTO DEL COMPONENTE
Estás generando un componente de aprendizaje dentro de la siguiente estructura:
- **Programa:** ${config.programa_nombre}
- **Fase:** ${config.fase_nombre} (ID: ${config.faseId})
- **Proof Point:** ${config.proof_point_nombre}
  - Pregunta Central: "${config.proof_point_pregunta}"
- **Nivel:** ${config.nivel_nombre}
  - Objetivo Específico: "${config.nivel_objetivo}"
- **Componente a Generar:** ${config.nombre_componente}`,
    );

    // --- 3. EL CONOCIMIENTO DEL INSTRUCTOR (El "Cerebro") ---
    // Esta es la parte más CRÍTICA
    if (doc) {
      promptParts.push(
        `# CONOCIMIENTO DEL INSTRUCTOR (FaseDocumentation)
Has recibido la siguiente documentación de la fase directamente del instructor. DEBES basar tu generación estrictamente en este conocimiento.

## Contexto General de la Fase:
${doc.contexto_general || doc.contexto || "No proporcionado"}

## Conceptos Clave (Definiciones y Ejemplos):
${this._formatJsonForPrompt(doc.conceptos_clave, "nombre", "definicion", "ejemplo")}

## Casos de Estudio Relevantes:
${this._formatJsonForPrompt(doc.casos_estudio, "titulo", "tipo", "descripcion", "fuente")}

## Errores Comunes que Cometen los Estudiantes:
${this._formatJsonForPrompt(doc.errores_comunes, "titulo", "explicacion", "como_evitar")}

## Recursos de Referencia:
${this._formatJsonForPrompt(doc.recursos_referencia, "titulo", "tipo", "url", "notas")}

## Criterios de Evaluación de la Fase:
${this._formatJsonForPrompt(doc.criterios_evaluacion, "nombre", "nivel_importancia", "descriptor")}`,
      );
    }

    // --- 4. LA TAREA ESPECÍFICA (Qué hacer) ---
    promptParts.push(
      `# TAREA DE GENERACIÓN
Tu tarea es generar el contenido para un componente de tipo: **${config.tipo_componente}**`,
    );

    // Bifurcación según tipo de componente
    if (config.tipo_componente === TipoComponente.LECCION) {
      promptParts.push(this._buildLeccionInstructions(config));
    } else if (config.tipo_componente === TipoComponente.CUADERNO) {
      promptParts.push(this._buildCuadernoInstructions(config));
    } else if (config.tipo_componente === TipoComponente.SIMULACION) {
      promptParts.push(this._buildSimulacionInstructions(config));
    } else if (config.tipo_componente === TipoComponente.HERRAMIENTA) {
      promptParts.push(this._buildHerramientaInstructions(config));
    }

    // --- 5. TAREA DE AUTO-ANÁLISIS (Auto-Evaluación de la IA) ---
    promptParts.push(
      `# TAREA DE ANÁLISIS DE CALIDAD
Después de generar el contenido, DEBES realizar un auto-análisis de calidad. Evalúa tu propio trabajo contra el objetivo del nivel y la documentación de la fase.

## Métricas a Evaluar (Score 0-100 para cada una):
1. **Lecturabilidad:** ¿Es el contenido fácil de entender para el público objetivo?
2. **Cobertura de Conceptos:** ¿Se cubrieron todos los "Conceptos Clave" relevantes?
3. **Alineación con Objetivos:** ¿El contenido ayuda directamente a cumplir "${config.nivel_objetivo}"?
4. **Uso de Documentación:** ¿Se integraron los "Casos de Estudio" y se evitaron los "Errores Comunes"?
5. **Profundidad Pedagógica:** ¿El contenido tiene la profundidad apropiada (nivel ${config.nivel_profundidad || 3}/5)?

Calcula un **score_general** (promedio de las 5 métricas) y genera **sugerencias** concretas de mejora (mínimo 2, máximo 5).

También genera una **comparacion_objetivos** verificando si cada objetivo de aprendizaje de la fase fue cubierto.`,
    );

    // --- 6. INSTRUCCIÓN DE FORMATO (CRÍTICO) ---
    const jsonOutputSchema = this._getJsonOutputSchema(config.tipo_componente);

    promptParts.push(
      `# FORMATO DE SALIDA (OBLIGATORIO)
Tu respuesta DEBE ser un único objeto JSON válido. No incluyas texto antes o después del JSON.
La estructura del JSON debe ser exactamente la siguiente:

\`\`\`json
${JSON.stringify(jsonOutputSchema, null, 2)}
\`\`\`

**IMPORTANTE:**
- Todos los scores deben ser números entre 0 y 100
- El campo "contenido" debe contener la estructura completa según el tipo de componente
- El campo "analisis_calidad" es OBLIGATORIO y debe incluir todas las métricas solicitadas
- Las sugerencias deben ser específicas y accionables`,
    );

    // Unir todas las partes
    return promptParts.join("\n\n");
  }

  /**
   * Construye las instrucciones específicas para generar una Lección
   */
  private _buildLeccionInstructions(config: GenerationConfigDto): string {
    const parts: string[] = [
      `## Instrucciones para Lección:
- Genera el contenido completo de la lección en formato **Markdown**.
- El contenido debe estar diseñado para cumplir el objetivo específico: "${config.nivel_objetivo}".
- Estructura la lección con una introducción clara, desarrollo de conceptos, y conclusión.
- Usa encabezados (##, ###) para organizar las secciones.
- Incluye ejemplos prácticos y concretos.`,
    ];

    const restrictions: string[] = ["## Restricciones y Preferencias:"];

    if (config.estilo_narrativo) {
      restrictions.push(
        `- **Estilo Narrativo:** ${config.estilo_narrativo} (mantén este tono consistentemente)`,
      );
    }

    if (config.nivel_profundidad) {
      restrictions.push(
        `- **Nivel de Profundidad:** ${config.nivel_profundidad}/5 (ajusta la complejidad técnica acorde)`,
      );
    }

    if (config.duracion_target) {
      restrictions.push(
        `- **Duración Objetivo:** Aproximadamente ${config.duracion_target} minutos de lectura`,
      );
    }

    if (config.elementos_incluir?.length) {
      restrictions.push(
        `- **Elementos Obligatorios:** ${config.elementos_incluir.join(", ")}`,
      );
    }

    if (config.conceptos_enfatizar?.length) {
      restrictions.push(
        `- **Conceptos para Enfatizar:** ${config.conceptos_enfatizar.join(", ")}`,
      );
    }

    if (config.casos_incluir?.length) {
      restrictions.push(
        `- **Casos que Mencionar:** ${config.casos_incluir.join(", ")}`,
      );
    }

    if (config.instrucciones_adicionales) {
      restrictions.push(
        `- **Instrucciones Adicionales:** ${config.instrucciones_adicionales}`,
      );
    }

    parts.push(restrictions.join("\n"));
    return parts.join("\n\n");
  }

  /**
   * Construye las instrucciones específicas para generar un Cuaderno
   */
  private _buildCuadernoInstructions(config: GenerationConfigDto): string {
    const parts: string[] = [
      `## Instrucciones para Cuaderno:
- Genera una serie de secciones y preguntas que guíen al estudiante a aplicar los conceptos.
- El objetivo es que el estudiante reflexione y practique sobre: "${config.nivel_objetivo}".
- Cada sección debe tener un título claro, instrucciones breves, y preguntas bien formuladas.
- Las preguntas deben promover pensamiento crítico y aplicación práctica.`,
    ];

    const restrictions: string[] = ["## Restricciones y Preferencias:"];

    if (config.numero_secciones) {
      restrictions.push(`- **Número de Secciones:** ${config.numero_secciones}`);
    }

    if (config.tipos_pregunta?.length) {
      restrictions.push(
        `- **Tipos de Preguntas:** Incluye una mezcla de ${config.tipos_pregunta.join(", ")}`,
      );
    }

    if (config.incluir_ejemplos_respuesta) {
      restrictions.push(
        `- **Ejemplos de Respuesta:** Para cada pregunta clave, genera un "ejemplo_respuesta_fuerte" que sirva como guía de evaluación`,
      );
    }

    if (config.nivel_guia) {
      restrictions.push(
        `- **Nivel de Guía:** ${config.nivel_guia}/5 (cantidad de ayuda/estructura proporcionada)`,
      );
    }

    if (config.instrucciones_adicionales) {
      restrictions.push(
        `- **Instrucciones Adicionales:** ${config.instrucciones_adicionales}`,
      );
    }

    parts.push(restrictions.join("\n"));
    return parts.join("\n\n");
  }

  /**
   * Construye las instrucciones específicas para generar una Simulación
   */
  private _buildSimulacionInstructions(config: GenerationConfigDto): string {
    const parts: string[] = [
      `## Instrucciones para Simulación:
- Diseña un escenario de simulación realista basado en: "${config.nivel_objetivo}".
- Crea un personaje (IA) con quien el estudiante interactuará.
- Genera un banco inicial de respuestas contextuales que el personaje podría usar.
- El escenario debe presentar un desafío auténtico que requiera aplicar los conceptos aprendidos.`,
    ];

    const restrictions: string[] = ["## Configuración del Escenario:"];

    if (config.personaje) {
      restrictions.push(
        `- **Personaje:**
  - Nombre: ${config.personaje.nombre}
  - Rol: ${config.personaje.rol}
  - Background: ${config.personaje.background}
  - Personalidad: ${config.personaje.personalidad}
  - Estilo de Comunicación: ${config.personaje.estilo_comunicacion}`,
      );
    }

    if (config.escenario) {
      restrictions.push(
        `- **Escenario:**
  - Contexto: ${config.escenario.contexto_situacion}
  - Objetivo: ${config.escenario.objetivo_conversacion}
  - Duración: ${config.escenario.duracion_estimada} minutos
  - Respuestas a generar: ${config.escenario.numero_respuestas_generar}`,
      );
    }

    if (config.habilidades_evaluar?.length) {
      restrictions.push(
        `- **Habilidades a Evaluar:** ${config.habilidades_evaluar.join(", ")}`,
      );
    }

    if (config.instrucciones_adicionales) {
      restrictions.push(
        `- **Instrucciones Adicionales:** ${config.instrucciones_adicionales}`,
      );
    }

    parts.push(restrictions.join("\n"));
    return parts.join("\n\n");
  }

  /**
   * Construye las instrucciones específicas para generar una Herramienta
   */
  private _buildHerramientaInstructions(config: GenerationConfigDto): string {
    return `## Instrucciones para Herramienta:
- Diseña una herramienta interactiva o framework que ayude al estudiante a lograr: "${config.nivel_objetivo}".
- La herramienta debe ser práctica y aplicable inmediatamente.
- Incluye instrucciones de uso claras y ejemplos de aplicación.

## Restricciones:
${config.instrucciones_adicionales ? `- ${config.instrucciones_adicionales}` : "- Enfócate en utilidad práctica"}`;
  }

  /**
   * Formatea un array de objetos JSON de la documentación
   * para que sea más legible para el LLM dentro del prompt.
   */
  private _formatJsonForPrompt(data: any[], ...fields: string[]): string {
    if (!data || data.length === 0) return "N/A (No proporcionado)";

    return data
      .map((item, index) => {
        const entries: string[] = [`**Item ${index + 1}:**`];
        for (const field of fields) {
          if (item[field] !== undefined && item[field] !== null) {
            const value =
              typeof item[field] === "object"
                ? JSON.stringify(item[field])
                : item[field];
            entries.push(`  - **${field}:** ${value}`);
          }
        }
        return entries.join("\n");
      })
      .join("\n\n");
  }

  /**
   * Devuelve el esquema JSON de salida esperado
   * basado en el tipo de componente.
   */
  private _getJsonOutputSchema(
    tipo: TipoComponente,
  ): Record<string, any> {
    const baseSchema: Record<string, any> = {
      contenido: {},
      analisis_calidad: {
        score_general: "number (0-100)",
        metricas: {
          lecturabilidad: {
            score: "number (0-100)",
            detalles: "string (explicación breve)",
          },
          cobertura_conceptos: {
            score: "number (0-100)",
            detalles: "string (explicación breve)",
          },
          alineacion_objetivos: {
            score: "number (0-100)",
            detalles: "string (explicación breve)",
          },
          uso_documentacion: {
            score: "number (0-100)",
            detalles: "string (explicación breve)",
          },
          profundidad_pedagogica: {
            score: "number (0-100)",
            detalles: "string (explicación breve)",
          },
        },
        sugerencias: [
          {
            prioridad: "string ('alta' | 'media' | 'baja')",
            descripcion: "string (sugerencia específica y accionable)",
          },
        ],
        comparacion_objetivos: [
          {
            objetivo: "string (objetivo de aprendizaje de la fase)",
            cumplido: "boolean",
            comentario: "string (breve explicación)",
          },
        ],
      },
    };

    // Configurar el esquema de contenido según el tipo
    if (tipo === TipoComponente.LECCION) {
      baseSchema.contenido = {
        markdown: "string (Contenido completo de la lección en formato Markdown)",
        palabras_estimadas: "number",
        tiempo_lectura_minutos: "number",
      };
    } else if (tipo === TipoComponente.CUADERNO) {
      baseSchema.contenido = {
        secciones: [
          {
            titulo: "string",
            instrucciones: "string",
            preguntas: [
              {
                pregunta: "string",
                tipo: "string (ej. 'reflexion', 'aplicacion', 'analisis')",
                ejemplo_respuesta_fuerte: "string (opcional)",
              },
            ],
          },
        ],
      };
    } else if (tipo === TipoComponente.SIMULACION) {
      baseSchema.contenido = {
        personaje: {
          nombre: "string",
          rol: "string",
          background: "string",
          personalidad: "string",
        },
        escenario_inicial: "string (descripción del escenario)",
        banco_respuestas: [
          {
            trigger: "string (palabras clave o contexto que activan esta respuesta)",
            texto_respuesta: "string",
            emocion: "string (opcional)",
          },
        ],
      };
    } else if (tipo === TipoComponente.HERRAMIENTA) {
      baseSchema.contenido = {
        nombre_herramienta: "string",
        descripcion: "string",
        instrucciones_uso: "string",
        pasos: ["string (cada paso de la herramienta)"],
        ejemplo_aplicacion: "string",
      };
    }

    return baseSchema;
  }

  private normalizeThingId(id: string, table: string) {
    if (!id) {
      throw new BadRequestException(
        `ID inválido para la tabla ${table}: ${id}`,
      );
    }

    const trimmed = id.trim();
    const parts = trimmed.split(":");
    const plain = parts.length > 1 ? parts[parts.length - 1] : trimmed;

    return {
      plain,
      record: `${table}:${plain}`,
    };
  }
}
