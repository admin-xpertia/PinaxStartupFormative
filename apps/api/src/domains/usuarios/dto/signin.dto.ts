import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

/**
 * DTO para inicio de sesión
 */
export class SigninDto {
  @ApiProperty({
    description: 'Email del usuario',
    example: 'instructor@example.com',
  })
  @IsEmail({}, { message: 'Email debe ser válido' })
  @IsNotEmpty({ message: 'Email es requerido' })
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'Password123!',
  })
  @IsString({ message: 'Contraseña debe ser un texto' })
  @IsNotEmpty({ message: 'Contraseña es requerida' })
  password: string;
}
