import { ApiProperty } from "@nestjs/swagger";

/**
 * DTO para respuesta de autenticación
 */
export class AuthResponseDto {
  @ApiProperty({
    description: "Token JWT generado por SurrealDB",
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  })
  token: string;

  @ApiProperty({
    description: "Tipo de token",
    example: "Bearer",
  })
  tokenType: string;

  @ApiProperty({
    description: "Duración del token en segundos",
    example: 1209600, // 14 días
  })
  expiresIn: number;

  @ApiProperty({
    description: "Información del usuario",
  })
  user: {
    id: string;
    email: string;
    nombre: string;
    rol: string;
  };

  constructor(token: string, user: any, expiresIn: number = 1209600) {
    this.token = token;
    this.tokenType = "Bearer";
    this.expiresIn = expiresIn;
    this.user = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol,
    };
  }
}
