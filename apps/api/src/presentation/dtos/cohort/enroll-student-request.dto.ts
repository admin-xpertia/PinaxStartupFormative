import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsOptional, IsEnum } from "class-validator";

export class EnrollStudentRequestDto {
  @ApiProperty({
    description: "ID del estudiante a inscribir",
    example: "estudiante:alumno_001",
  })
  @IsString()
  @IsNotEmpty()
  estudianteId: string;

  @ApiPropertyOptional({
    description: "Estado inicial de la inscripción",
    enum: ["activo", "completado", "abandonado", "suspendido"],
    example: "activo",
  })
  @IsOptional()
  @IsEnum(["activo", "completado", "abandonado", "suspendido"])
  estado?: "activo" | "completado" | "abandonado" | "suspendido";
}
