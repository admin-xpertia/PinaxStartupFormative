import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsString,
  MinLength,
  Matches,
  MaxLength,
} from "class-validator";
import { Transform } from "class-transformer";

export class SignupDto {
  @ApiProperty({
    description: "Full name",
    example: "Juan Pérez",
  })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nombre: string;

  @ApiProperty({
    description: "Email address",
    example: "instructor@example.com",
  })
  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({
    description:
      "Password (min 8 characters, must include letters and numbers)",
    example: "Password123!",
  })
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: "La contraseña debe incluir letras y números",
  })
  password: string;
}
