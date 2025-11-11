import { ValueObject } from '../../shared/types/ValueObject';

/**
 * Field types supported in configuration schemas
 */
export type ConfigFieldType =
  | 'number'
  | 'boolean'
  | 'string'
  | 'select'
  | 'multiselect'
  | 'text';

/**
 * Minimal subset of JSON Schema used by templates
 */
interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
}

interface JsonSchemaProperty {
  type?: string;
  description?: string;
  title?: string;
  default?: any;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  items?: {
    type?: string;
    enum?: string[];
  };
}

/**
 * Configuration field definition
 */
export interface ConfigurationField {
  type: ConfigFieldType;
  label: string;
  description?: string;
  default?: any;
  required?: boolean;
  min?: number;
  max?: number;
  options?: string[];
  placeholder?: string;
}

/**
 * ConfigurationSchema Value Object
 * Defines the schema for exercise configuration
 */
export class ConfigurationSchema extends ValueObject<{
  fields: Record<string, ConfigurationField>;
}> {
  private readonly sourceSchema?: JsonSchema;

  private constructor(
    fields: Record<string, ConfigurationField>,
    sourceSchema?: JsonSchema,
  ) {
    super({ fields });
    this.sourceSchema = sourceSchema;
    this.validate();
  }

  /**
   * Factory that accepts either our internal representation (Record<string, ConfigurationField>)
   * or the JSON Schema structure persisted in the database.
   */
  static create(
    schema?: Record<string, ConfigurationField> | JsonSchema | null,
  ): ConfigurationSchema {
    if (!schema || Object.keys(schema).length === 0) {
      return new ConfigurationSchema({});
    }

    // If the schema uses JSON Schema format, convert it to internal representation
    if ('properties' in schema) {
      const converted = this.fromJsonSchema(schema as JsonSchema);
      return new ConfigurationSchema(converted.fields, converted.sourceSchema);
    }

    return new ConfigurationSchema(schema as Record<string, ConfigurationField>);
  }

  static empty(): ConfigurationSchema {
    return new ConfigurationSchema({});
  }

  getFields(): Record<string, ConfigurationField> {
    return { ...this.props.fields };
  }

  getField(name: string): ConfigurationField | undefined {
    return this.props.fields[name];
  }

  hasField(name: string): boolean {
    return name in this.props.fields;
  }

  getFieldNames(): string[] {
    return Object.keys(this.props.fields);
  }

  /**
   * Validates a configuration object against this schema
   */
  validateConfiguration(config: Record<string, any>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const [fieldName, fieldDef] of Object.entries(this.props.fields)) {
      const value = config[fieldName];

      // Check required fields
      if (fieldDef.required && (value === undefined || value === null)) {
        errors.push(`Field "${fieldName}" is required`);
        continue;
      }

      // Skip validation if not present and not required
      if (value === undefined || value === null) {
        continue;
      }

      // Type validation
      switch (fieldDef.type) {
        case 'number':
          if (typeof value !== 'number') {
            errors.push(`Field "${fieldName}" must be a number`);
          } else {
            if (fieldDef.min !== undefined && value < fieldDef.min) {
              errors.push(`Field "${fieldName}" must be >= ${fieldDef.min}`);
            }
            if (fieldDef.max !== undefined && value > fieldDef.max) {
              errors.push(`Field "${fieldName}" must be <= ${fieldDef.max}`);
            }
          }
          break;

        case 'boolean':
          if (typeof value !== 'boolean') {
            errors.push(`Field "${fieldName}" must be a boolean`);
          }
          break;

        case 'string':
        case 'text':
          if (typeof value !== 'string') {
            errors.push(`Field "${fieldName}" must be a string`);
          }
          break;

        case 'select':
          if (fieldDef.options && !fieldDef.options.includes(value)) {
            errors.push(
              `Field "${fieldName}" must be one of: ${fieldDef.options.join(', ')}`,
            );
          }
          break;

        case 'multiselect':
          if (!Array.isArray(value)) {
            errors.push(`Field "${fieldName}" must be an array`);
          } else if (fieldDef.options) {
            const invalidOptions = value.filter(v => !fieldDef.options!.includes(v));
            if (invalidOptions.length > 0) {
              errors.push(
                `Field "${fieldName}" contains invalid options: ${invalidOptions.join(', ')}`,
              );
            }
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
   * Merges default values with provided configuration
   */
  mergeWithDefaults(config: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [fieldName, fieldDef] of Object.entries(this.props.fields)) {
      if (config[fieldName] !== undefined) {
        result[fieldName] = config[fieldName];
      } else if (fieldDef.default !== undefined) {
        result[fieldName] = fieldDef.default;
      }
    }

    return result;
  }

  private validate(): void {
    for (const [fieldName, fieldDef] of Object.entries(this.props.fields)) {
      if (!fieldDef.type) {
        throw new Error(`Field "${fieldName}" must have a type`);
      }

      if (!fieldDef.label) {
        throw new Error(`Field "${fieldName}" must have a label`);
      }

      if (fieldDef.type === 'select' && !fieldDef.options) {
        throw new Error(`Select field "${fieldName}" must have options`);
      }
    }
  }

  equals(vo?: ValueObject<{ fields: Record<string, ConfigurationField> }>): boolean {
    if (!vo) return false;
    const other = vo as ConfigurationSchema;
    return JSON.stringify(this.props.fields) === JSON.stringify(other.props.fields);
  }

  toJSON(): JsonSchema {
    if (this.sourceSchema && this.sourceSchema.properties) {
      return this.sourceSchema;
    }

    const properties: Record<string, any> = {};
    const required: string[] = [];

    for (const [fieldName, fieldDef] of Object.entries(this.props.fields)) {
      const property: Record<string, any> = {
        type: this.mapConfigTypeToJsonType(fieldDef.type),
        description: fieldDef.description || fieldDef.label || fieldName,
      };

      if (fieldDef.default !== undefined) {
        property.default = fieldDef.default;
      }

      if (fieldDef.min !== undefined) {
        property.minimum = fieldDef.min;
      }

      if (fieldDef.max !== undefined) {
        property.maximum = fieldDef.max;
      }

      if (fieldDef.options && fieldDef.options.length > 0) {
        if (fieldDef.type === 'multiselect') {
          property.type = 'array';
          property.items = {
            type: 'string',
            enum: fieldDef.options,
          };
        } else {
          property.enum = fieldDef.options;
        }
      }

      properties[fieldName] = property;

      if (fieldDef.required) {
        required.push(fieldName);
      }
    }

    const schema: JsonSchema = {
      type: 'object',
      properties,
    };

    if (required.length > 0) {
      schema.required = required;
    }

    return schema;
  }

  private static fromJsonSchema(schema: JsonSchema): {
    fields: Record<string, ConfigurationField>;
    sourceSchema: JsonSchema;
  } {
    const required = new Set(schema.required || []);
    const fields: Record<string, ConfigurationField> = {};

    for (const [fieldName, fieldSchema] of Object.entries(
      schema.properties || {},
    )) {
      if (!fieldSchema || typeof fieldSchema !== 'object') {
        continue;
      }

      const mappedType = this.mapJsonTypeToConfigType(fieldSchema);
      const options =
        fieldSchema.enum || fieldSchema.items?.enum || undefined;

      fields[fieldName] = {
        type: mappedType,
        label: fieldSchema.description || fieldSchema.title || fieldName,
        description: fieldSchema.description,
        default: fieldSchema.default,
        required: required.has(fieldName),
        min: fieldSchema.minimum,
        max: fieldSchema.maximum,
        options: options && options.length > 0 ? options : undefined,
      };
    }

    return {
      fields,
      sourceSchema: schema,
    };
  }

  private static mapJsonTypeToConfigType(fieldSchema: JsonSchemaProperty): ConfigFieldType {
    if (fieldSchema.enum && fieldSchema.enum.length > 0) {
      return 'select';
    }

    if (
      fieldSchema.type === 'array' &&
      fieldSchema.items &&
      fieldSchema.items.enum &&
      fieldSchema.items.enum.length > 0
    ) {
      return 'multiselect';
    }

    switch (fieldSchema.type) {
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return 'multiselect';
      case 'object':
        return 'text';
      case 'string':
      default:
        return 'string';
    }
  }

  private mapConfigTypeToJsonType(type: ConfigFieldType): string {
    switch (type) {
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'multiselect':
        return 'array';
      case 'text':
      case 'string':
      case 'select':
      default:
        return 'string';
    }
  }
}
