import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength } from "class-validator";
import { Transform } from "class-transformer";

export class SigninDto {
  @ApiProperty({
    description: "User email",
    example: "instructor@example.com",
  })
  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({
    description: "Account password",
    example: "Password123!",
  })
  @IsString()
  @MinLength(8)
  password: string;
}
