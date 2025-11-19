import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class StudentProfileResponseDto {
  @ApiProperty({
    description: "ID del perfil de estudiante",
    example: "estudiante:alumno_001",
  })
  id: string;

  @ApiProperty({
    description: "ID del usuario asociado",
    example: "user:estudiante_real",
  })
  userId: string;

  @ApiProperty({
    description: "Nombre del estudiante",
    example: "Mariana Torres",
  })
  nombre: string;

  @ApiPropertyOptional({
    description: "Correo electrónico",
    example: "estudiante@xpertia.com",
  })
  email?: string;

  @ApiPropertyOptional({
    description: "Información adicional",
    example: { pais: "Chile", ciudad: "Santiago" },
  })
  metadata?: Record<string, any>;
}
