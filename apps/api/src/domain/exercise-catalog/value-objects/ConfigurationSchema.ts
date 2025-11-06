import { ValueObject } from '../../shared/types/ValueObject';

/**
 * Field types supported in configuration schemas
 */
export type ConfigFieldType = 'number' | 'boolean' | 'string' | 'select' | 'multiselect' | 'text';

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
  private constructor(fields: Record<string, ConfigurationField>) {
    super({ fields });
    this.validate();
  }

  static create(fields: Record<string, ConfigurationField>): ConfigurationSchema {
    return new ConfigurationSchema(fields);
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

  toJSON(): Record<string, ConfigurationField> {
    return this.props.fields;
  }
}
