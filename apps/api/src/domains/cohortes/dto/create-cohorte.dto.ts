import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
} from "class-validator";

export class CreateCohorteDto {
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsDateString()
  fecha_inicio: string;

  @IsDateString()
  @IsOptional()
  fecha_fin_estimada?: string;

  @IsString()
  @IsNotEmpty()
  programa_id_original: string; // ej. "programa:xyz" o solo "xyz"
}
