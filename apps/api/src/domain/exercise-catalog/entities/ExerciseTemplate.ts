import { AggregateRoot } from '../../shared/types/AggregateRoot';
import { RecordId } from '../../shared/value-objects/RecordId';
import { Timestamp } from '../../shared/value-objects/Timestamp';
import { ExerciseCategory } from '../value-objects/ExerciseCategory';
import { ConfigurationSchema } from '../value-objects/ConfigurationSchema';

/**
 * ExerciseTemplate Entity (Aggregate Root)
 * Represents a template for AI-mediated exercises
 * Part of the Exercise Catalog
 */

export interface ExerciseTemplateProps {
  nombre: string;
  categoria: ExerciseCategory;
  descripcion: string;
  objetivoPedagogico?: string;
  rolIA?: string;
  configuracionSchema: ConfigurationSchema;
  configuracionDefault: Record<string, any>;
  promptTemplate: string;
  outputSchema: Record<string, any>;
  previewConfig: Record<string, any>;
  icono: string;
  color: string;
  esOficial: boolean;
  activo: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export class ExerciseTemplate extends AggregateRoot<ExerciseTemplateProps> {
  private constructor(id: RecordId, props: ExerciseTemplateProps) {
    super(id, props);
  }

  /**
   * Creates a new ExerciseTemplate (Factory method)
   */
  static create(
    nombre: string,
    categoria: ExerciseCategory,
    descripcion: string,
    promptTemplate: string,
    outputSchema: Record<string, any>,
    configuracionSchema?: ConfigurationSchema,
    id?: RecordId,
  ): ExerciseTemplate {
    const templateId =
      id || RecordId.create('exercise_template', `${Date.now()}_${Math.random()}`);

    if (nombre.trim().length < 3) {
      throw new Error('Exercise template name must be at least 3 characters');
    }

    if (!promptTemplate || promptTemplate.trim().length === 0) {
      throw new Error('Prompt template cannot be empty');
    }

    const template = new ExerciseTemplate(templateId, {
      nombre,
      categoria,
      descripcion,
      configuracionSchema: configuracionSchema || ConfigurationSchema.empty(),
      configuracionDefault: {},
      promptTemplate,
      outputSchema,
      previewConfig: {},
      icono: categoria.getDefaultIcon(),
      color: '#6366f1',
      esOficial: true,
      activo: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return template;
  }

  /**
   * Reconstitutes an ExerciseTemplate from persistence
   */
  static reconstitute(id: RecordId, props: ExerciseTemplateProps): ExerciseTemplate {
    return new ExerciseTemplate(id, props);
  }

  // ========== Getters ==========

  getNombre(): string {
    return this.props.nombre;
  }

  getCategoria(): ExerciseCategory {
    return this.props.categoria;
  }

  getDescripcion(): string {
    return this.props.descripcion;
  }

  getObjetivoPedagogico(): string | undefined {
    return this.props.objetivoPedagogico;
  }

  getRolIA(): string | undefined {
    return this.props.rolIA;
  }

  getConfiguracionSchema(): ConfigurationSchema {
    return this.props.configuracionSchema;
  }

  getConfiguracionDefault(): Record<string, any> {
    return { ...this.props.configuracionDefault };
  }

  getPromptTemplate(): string {
    return this.props.promptTemplate;
  }

  getOutputSchema(): Record<string, any> {
    return { ...this.props.outputSchema };
  }

  getPreviewConfig(): Record<string, any> {
    return { ...this.props.previewConfig };
  }

  getIcono(): string {
    return this.props.icono;
  }

  getColor(): string {
    return this.props.color;
  }

  isOficial(): boolean {
    return this.props.esOficial;
  }

  isActivo(): boolean {
    return this.props.activo;
  }

  // ========== Business Methods ==========

  /**
   * Updates basic template information
   */
  updateInfo(nombre?: string, descripcion?: string): void {
    if (nombre) {
      if (nombre.trim().length < 3) {
        throw new Error('Exercise template name must be at least 3 characters');
      }
      this.props.nombre = nombre;
    }

    if (descripcion !== undefined) {
      this.props.descripcion = descripcion;
    }

    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates pedagogical information
   */
  updatePedagogicalInfo(objetivoPedagogico?: string, rolIA?: string): void {
    if (objetivoPedagogico !== undefined) {
      this.props.objetivoPedagogico = objetivoPedagogico;
    }

    if (rolIA !== undefined) {
      this.props.rolIA = rolIA;
    }

    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates configuration schema
   */
  updateConfiguracionSchema(schema: ConfigurationSchema): void {
    this.props.configuracionSchema = schema;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates default configuration
   */
  updateConfiguracionDefault(config: Record<string, any>): void {
    // Validate against schema
    const validation = this.props.configuracionSchema.validateConfiguration(config);
    if (!validation.valid) {
      throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
    }

    this.props.configuracionDefault = { ...config };
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates prompt template
   */
  updatePromptTemplate(template: string): void {
    if (!template || template.trim().length === 0) {
      throw new Error('Prompt template cannot be empty');
    }

    this.props.promptTemplate = template;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates output schema
   */
  updateOutputSchema(schema: Record<string, any>): void {
    this.props.outputSchema = { ...schema };
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates preview configuration
   */
  updatePreviewConfig(config: Record<string, any>): void {
    this.props.previewConfig = { ...config };
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates visual appearance
   */
  updateAppearance(icono?: string, color?: string): void {
    if (icono !== undefined) {
      this.props.icono = icono;
    }

    if (color !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        throw new Error('Color must be a valid hex color (e.g., #6366f1)');
      }
      this.props.color = color;
    }

    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Activates the template
   */
  activate(): void {
    this.props.activo = true;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Deactivates the template
   */
  deactivate(): void {
    this.props.activo = false;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Validates a configuration against this template's schema
   */
  validateConfiguration(config: Record<string, any>): { valid: boolean; errors: string[] } {
    return this.props.configuracionSchema.validateConfiguration(config);
  }

  /**
   * Merges user configuration with defaults
   */
  mergeConfiguration(userConfig: Record<string, any>): Record<string, any> {
    const withDefaults = this.props.configuracionSchema.mergeWithDefaults(userConfig);
    return {
      ...this.props.configuracionDefault,
      ...withDefaults,
    };
  }

  /**
   * Interpolates the prompt template with provided context
   */
  interpolatePrompt(context: Record<string, any>): string {
    let prompt = this.props.promptTemplate;

    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      prompt = prompt.replace(regex, String(value));
    }

    return prompt;
  }

  // ========== Serialization ==========

  /**
   * Converts to a plain object for persistence
   */
  toPersistence(): any {
    return {
      id: this.getId().toString(),
      nombre: this.props.nombre,
      categoria: this.props.categoria.getValue(),
      descripcion: this.props.descripcion,
      objetivo_pedagogico: this.props.objetivoPedagogico,
      rol_ia: this.props.rolIA,
      configuracion_schema: this.props.configuracionSchema.toJSON(),
      configuracion_default: this.props.configuracionDefault,
      prompt_template: this.props.promptTemplate,
      output_schema: this.props.outputSchema,
      preview_config: this.props.previewConfig,
      icono: this.props.icono,
      color: this.props.color,
      es_oficial: this.props.esOficial,
      activo: this.props.activo,
      created_at: this.props.createdAt.toISOString(),
      updated_at: this.props.updatedAt.toISOString(),
    };
  }
}
