import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class StudentProfileResponseDto {
  @ApiProperty({
    description: "ID del perfil de estudiante",
    example: "estudiante:demo",
  })
  id: string;

  @ApiProperty({
    description: "ID del usuario asociado",
    example: "user:estudiante_demo",
  })
  userId: string;

  @ApiProperty({
    description: "Nombre del estudiante",
    example: "Estudiante Demo",
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
