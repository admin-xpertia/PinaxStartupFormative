import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { SurrealDbService } from 'src/core/database';
import {
  ExerciseTemplate,
  ExerciseCategory,
  RecordId,
  ConfigurationField,
  ConfigurationSchema
} from '@repo/database/types';

export interface GetTemplatesFilters {
  categoria?: ExerciseCategory;
  esOficial?: boolean;
  activo?: boolean;
}

@Injectable()
export class ExerciseTemplatesService {
  private readonly logger = new Logger(ExerciseTemplatesService.name);

  constructor(private readonly surrealDb: SurrealDbService) {}

  /**
   * Obtiene todos los templates de ejercicios disponibles.
   * Usado para mostrar la biblioteca de ejercicios al instructor.
   */
  async getAllTemplates(filtros: GetTemplatesFilters = {}): Promise<ExerciseTemplate[]> {
    const { categoria, esOficial, activo } = filtros;

    let query = 'SELECT * FROM exercise_template';
    const conditions: string[] = [];
    const params: Record<string, any> = {};

    // Solo mostrar templates activos por defecto
    if (activo !== false) {
      conditions.push('activo = $activo');
      params.activo = activo ?? true;
    }

    if (categoria) {
      conditions.push('categoria = $categoria');
      params.categoria = categoria;
    }

    if (esOficial !== undefined) {
      conditions.push('es_oficial = $esOficial');
      params.esOficial = esOficial;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY categoria, nombre';

    const result = await this.surrealDb.query<ExerciseTemplate[]>(query, params);

    this.logger.log(`Obtenidos ${result.length} templates de ejercicios`);

    return result;
  }

  /**
   * Obtiene un template específico por su ID.
   */
  async getTemplateById(templateId: string): Promise<ExerciseTemplate> {
    const query = 'SELECT * FROM type::thing("exercise_template", $templateId)';

    const result = await this.surrealDb.query<ExerciseTemplate[]>(query, {
      templateId: this.extractId(templateId),
    });

    const template = result?.[0];

    if (!template) {
      throw new NotFoundException(
        `Template de ejercicio con ID ${templateId} no encontrado`,
      );
    }

    return template;
  }

  /**
   * Obtiene templates agrupados por categoría.
   * Útil para mostrar la biblioteca organizada en la UI.
   */
  async getTemplatesGroupedByCategory(): Promise<
    Record<ExerciseCategory, ExerciseTemplate[]>
  > {
    const templates = await this.getAllTemplates({ activo: true });

    const grouped = templates.reduce(
      (acc, template) => {
        const categoria = template.categoria;
        if (!acc[categoria]) {
          acc[categoria] = [];
        }
        acc[categoria].push(template);
        return acc;
      },
      {} as Record<ExerciseCategory, ExerciseTemplate[]>,
    );

    return grouped;
  }

  /**
   * Valida que una configuración personalizada sea válida según el schema del template.
   */
  validateConfiguration(
    template: ExerciseTemplate,
    configuracion: Record<string, any>,
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const schema = template.configuracion_schema;

    for (const [key, fieldSchema] of Object.entries(schema)) {
      const value = configuracion[key];
      const field = fieldSchema as ConfigurationField;

      // Si no está presente, usar default
      if (value === undefined || value === null) {
        continue;
      }

      // Validar tipo
      switch (field.type) {
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`${key}: debe ser un número`);
          } else {
            if (field.min !== undefined && value < field.min) {
              errors.push(`${key}: debe ser mayor o igual a ${field.min}`);
            }
            if (field.max !== undefined && value > field.max) {
              errors.push(`${key}: debe ser menor o igual a ${field.max}`);
            }
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`${key}: debe ser un booleano`);
          }
          break;

        case 'select':
          if (field.options && !field.options.includes(value)) {
            errors.push(
              `${key}: debe ser uno de: ${field.options.join(', ')}`,
            );
          }
          break;

        case 'multiselect':
          if (!Array.isArray(value)) {
            errors.push(`${key}: debe ser un array`);
          } else if (field.options) {
            const invalidOptions = value.filter(
              (v) => !field.options!.includes(v),
            );
            if (invalidOptions.length > 0) {
              errors.push(
                `${key}: opciones inválidas: ${invalidOptions.join(', ')}`,
              );
            }
          }
          break;

        case 'string':
          if (typeof value !== 'string') {
            errors.push(`${key}: debe ser una cadena de texto`);
          }
          break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Genera la configuración final mezclando defaults con personalizaciones.
   */
  mergeConfiguration(
    template: ExerciseTemplate,
    personalizacion: Record<string, any> = {},
  ): Record<string, any> {
    const merged = { ...template.configuracion_default };

    // Sobrescribir con valores personalizados
    for (const [key, value] of Object.entries(personalizacion)) {
      if (value !== undefined && value !== null) {
        merged[key] = value;
      }
    }

    return merged;
  }

  /**
   * Interpola variables en el prompt template con valores contextuales.
   *
   * Variables soportadas:
   * - {{programa.nombre}}, {{programa.descripcion}}
   * - {{fase.nombre}}, {{fase.descripcion}}
   * - {{proof_point.pregunta_central}}, {{proof_point.documentacion_contexto}}
   * - {{fase_documentation}}
   * - {{consideraciones}}
   * - {{configuracion.campo}}
   */
  interpolatePromptTemplate(
    template: ExerciseTemplate,
    context: {
      programa?: any;
      fase?: any;
      proof_point?: any;
      fase_documentation?: any;
      consideraciones?: string;
      configuracion?: Record<string, any>;
    },
  ): string {
    let prompt = template.prompt_template;

    // Reemplazar variables del contexto
    const replacements: Record<string, any> = {
      'programa.nombre': context.programa?.nombre || '',
      'programa.descripcion': context.programa?.descripcion || '',
      'fase.nombre': context.fase?.nombre || '',
      'fase.descripcion': context.fase?.descripcion || '',
      'fase.numero_fase': context.fase?.numero_fase || '',
      'proof_point.pregunta_central': context.proof_point?.pregunta_central || '',
      'proof_point.nombre': context.proof_point?.nombre || '',
      'proof_point.documentacion_contexto':
        context.proof_point?.documentacion_contexto || '',
      fase_documentation: JSON.stringify(context.fase_documentation, null, 2) || '{}',
      consideraciones: context.consideraciones || 'No se proporcionaron consideraciones específicas',
      contexto_completo: this.buildFullContext(context),
      output_schema: JSON.stringify(template.output_schema, null, 2),
    };

    // Reemplazar variables de configuración
    if (context.configuracion) {
      for (const [key, value] of Object.entries(context.configuracion)) {
        replacements[`configuracion.${key}`] = value;
      }
    }

    // Realizar reemplazos
    for (const [key, value] of Object.entries(replacements)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      prompt = prompt.replace(regex, String(value));
    }

    return prompt;
  }

  /**
   * Construye un contexto completo en texto para el prompt.
   */
  private buildFullContext(context: {
    programa?: any;
    fase?: any;
    proof_point?: any;
    fase_documentation?: any;
  }): string {
    const parts: string[] = [];

    if (context.programa) {
      parts.push(`PROGRAMA: ${context.programa.nombre}`);
      if (context.programa.descripcion) {
        parts.push(`Descripción: ${context.programa.descripcion}`);
      }
    }

    if (context.fase) {
      parts.push(`\nFASE ${context.fase.numero_fase}: ${context.fase.nombre}`);
      if (context.fase.descripcion) {
        parts.push(`Descripción: ${context.fase.descripcion}`);
      }
      if (context.fase.objetivos_aprendizaje?.length) {
        parts.push(
          `Objetivos: ${context.fase.objetivos_aprendizaje.join(', ')}`,
        );
      }
    }

    if (context.proof_point) {
      parts.push(`\nPROOF POINT: ${context.proof_point.nombre}`);
      if (context.proof_point.pregunta_central) {
        parts.push(`Pregunta Central: ${context.proof_point.pregunta_central}`);
      }
      if (context.proof_point.documentacion_contexto) {
        parts.push(`\nContexto Específico:\n${context.proof_point.documentacion_contexto}`);
      }
    }

    if (context.fase_documentation) {
      parts.push('\nDOCUMENTACIÓN DE LA FASE:');

      if (context.fase_documentation.contexto_general) {
        parts.push(`\nContexto General:\n${context.fase_documentation.contexto_general}`);
      }

      if (context.fase_documentation.conceptos_clave?.length) {
        parts.push('\nConceptos Clave:');
        context.fase_documentation.conceptos_clave.forEach((concepto: any, i: number) => {
          parts.push(`${i + 1}. ${concepto.nombre || concepto.termino}: ${concepto.definicion || concepto.descripcion}`);
        });
      }

      if (context.fase_documentation.casos_ejemplo?.length) {
        parts.push('\nCasos de Ejemplo:');
        context.fase_documentation.casos_ejemplo.forEach((caso: any, i: number) => {
          parts.push(`${i + 1}. ${caso.titulo || caso.nombre}: ${caso.descripcion}`);
        });
      }

      if (context.fase_documentation.errores_comunes?.length) {
        parts.push('\nErrores Comunes:');
        context.fase_documentation.errores_comunes.forEach((error: any, i: number) => {
          parts.push(`${i + 1}. ${error.descripcion || error}`);
        });
      }
    }

    return parts.join('\n');
  }

  /**
   * Extrae el ID limpio de un RecordId de SurrealDB.
   */
  private extractId(recordId: string): string {
    if (recordId.includes(':')) {
      return recordId.split(':')[1];
    }
    return recordId;
  }
}
