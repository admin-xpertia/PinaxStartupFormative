import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class StartExerciseDto {
  @ApiProperty({
    description: 'ID del estudiante',
    example: 'estudiante:abc123',
  })
  @IsString()
  estudianteId: string;

  @ApiProperty({
    description: 'ID de la cohorte',
    example: 'cohorte:xyz789',
  })
  @IsString()
  cohorteId: string;
}
