import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * DTO para registro de nuevos usuarios (instructores)
 */
export class SignupDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'instructor@example.com',
  })
  @IsEmail({}, { message: 'Email debe ser válido' })
  @IsNotEmpty({ message: 'Email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Nombre completo del usuario',
    example: 'Juan Pérez',
  })
  @IsString({ message: 'Nombre debe ser un texto' })
  @IsNotEmpty({ message: 'Nombre es requerido' })
  @MinLength(2, { message: 'Nombre debe tener al menos 2 caracteres' })
  nombre: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Password123!',
    minLength: 8,
  })
  @IsString({ message: 'Contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'Contraseña es requerida' })
  @MinLength(8, { message: 'Contraseña debe tener al menos 8 caracteres' })
  password: string;
}
