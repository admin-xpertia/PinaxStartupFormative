import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsArray,
} from "class-validator";

export class CreateStudentDto {
  @ApiProperty({
    description: "Correo electrónico del estudiante",
    example: "estudiante@nueva.com",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "Nombre completo del estudiante",
    example: "Estudiante Test",
  })
  @IsString()
  @MinLength(2)
  nombre: string;

  @ApiProperty({
    description: "Contraseña del estudiante",
    example: "ClaveSegura123!",
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: "ID de la cohorte para inscripción automática",
    example: "cohorte:primavera_2025",
  })
  @IsOptional()
  @IsString()
  cohorteId?: string;

  @ApiPropertyOptional({
    description: "Información extra del perfil",
    example: { pais: "Chile", ciudad: "Santiago" },
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: "País de residencia",
    example: "Chile",
  })
  @IsOptional()
  @IsString()
  pais?: string;

  @ApiPropertyOptional({
    description: "Ciudad de residencia",
    example: "Santiago",
  })
  @IsOptional()
  @IsString()
  ciudad?: string;

  @ApiPropertyOptional({
    description: "Nivel educativo",
    example: "Universitario",
  })
  @IsOptional()
  @IsString()
  nivelEducativo?: string;

  @ApiPropertyOptional({
    description: "Intereses del estudiante",
    example: ["innovación", "emprendimiento"],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  intereses?: string[];

  @ApiPropertyOptional({
    description: "Biografía",
    example: "Apasionado/a por la tecnología educativa",
  })
  @IsOptional()
  @IsString()
  biografia?: string;
}
