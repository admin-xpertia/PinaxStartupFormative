import {
  IsNotEmpty,
  IsString,
  IsBoolean,
  IsObject,
  IsOptional,
  IsIn,
} from "class-validator";

/**
 * DTO para crear una plantilla de prompt.
 */
export class CrearPromptTemplateDto {
  @IsNotEmpty()
  @IsString()
  nombre!: string;

  @IsNotEmpty()
  @IsString()
  descripcion!: string;

  @IsNotEmpty()
  @IsString()
  @IsIn(["leccion", "cuaderno", "simulacion", "herramienta"])
  tipoComponente!: "leccion" | "cuaderno" | "simulacion" | "herramienta";

  @IsNotEmpty()
  @IsString()
  promptTemplate!: string; // Texto del prompt con variables {{ }}

  @IsOptional()
  @IsObject()
  configDefault?: Record<string, any>; // Configuración por defecto (modelo, temperatura, etc.)

  @IsOptional()
  @IsString()
  autor?: string;

  @IsOptional()
  @IsBoolean()
  esOficial?: boolean; // Indica si es una plantilla oficial de Xpertia
}

/**
 * DTO para actualizar una plantilla de prompt.
 */
export class ActualizarPromptTemplateDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  promptTemplate?: string;

  @IsOptional()
  @IsObject()
  configDefault?: Record<string, any>;

  @IsOptional()
  @IsString()
  autor?: string;
}

/**
 * DTO para buscar plantillas por tipo de componente.
 */
export class BuscarPromptTemplatesDto {
  @IsOptional()
  @IsString()
  @IsIn(["leccion", "cuaderno", "simulacion", "herramienta"])
  tipoComponente?: "leccion" | "cuaderno" | "simulacion" | "herramienta";

  @IsOptional()
  @IsBoolean()
  esOficial?: boolean;
}
