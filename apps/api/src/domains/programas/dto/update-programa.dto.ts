import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsArray,
  Min,
  Max,
  MinLength,
} from "class-validator";

export class UpdateProgramaDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "El nombre no puede estar vacío" })
  nombre?: string;

  @IsOptional()
  @IsString()
  @MinLength(50, { message: "La descripción debe tener al menos 50 caracteres" })
  descripcion?: string;

  @IsOptional()
  @IsString()
  categoria?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(52)
  duracion_semanas?: number;

  @IsOptional()
  @IsEnum(["principiante", "intermedio", "avanzado"])
  nivel_dificultad?: string;

  @IsOptional()
  @IsString()
  imagen_portada_url?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  objetivos_aprendizaje?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  prerequisitos?: string[];

  @IsOptional()
  @IsString()
  audiencia_objetivo?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @IsEnum(["borrador", "revision", "publicado"])
  estado?: string;
}
