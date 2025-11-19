import { ApiProperty } from "@nestjs/swagger";

export class AuthUserDto {
  @ApiProperty({
    description: "Unique identifier of the user (SurrealDB record id)",
    example: "user:abc123",
  })
  id: string;

  @ApiProperty({
    description: "Email address",
    example: "instructor@example.com",
  })
  email: string;

  @ApiProperty({
    description: "Full name",
    example: "Juan Pérez",
  })
  nombre: string;

  @ApiProperty({
    description: "User role",
    example: "instructor",
    enum: ["admin", "instructor", "estudiante"],
  })
  rol: string;

  @ApiProperty({
    description: "Whether the account is active",
    example: true,
  })
  activo?: boolean;

  @ApiProperty({
    description: "User preferences",
    example: { theme: "dark" },
    required: false,
  })
  preferencias?: Record<string, any>;

  @ApiProperty({
    description: "ID del perfil de estudiante (cuando aplica)",
    example: "estudiante:abc123",
    required: false,
  })
  studentId?: string;
}
