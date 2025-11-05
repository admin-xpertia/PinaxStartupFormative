import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class ProofPointDto {
  @IsString()
  id!: string;

  @IsString()
  @IsNotEmpty()
  nombre_pp!: string;

  @IsString()
  slug_pp!: string;

  @IsString()
  descripcion_pp!: string;

  @IsString()
  @IsNotEmpty()
  pregunta_central!: string;

  @IsString()
  tipo_entregable!: string;

  @IsInt()
  numero_niveles!: number;

  @IsArray()
  @IsString({ each: true })
  prerequisitos!: string[];

  @IsInt()
  duracion_estimada_horas!: number;
}

class FaseDto {
  @IsString()
  id!: string;

  @IsString()
  @IsNotEmpty()
  nombre_fase!: string;

  @IsString()
  descripcion_fase!: string;

  @IsString()
  objetivos_aprendizaje!: string;

  @IsInt()
  duracion_semanas_fase!: number;

  @IsInt()
  numero_proof_points!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProofPointDto)
  proof_points!: ProofPointDto[];
}

export class CreateProgramDto {
  @IsString()
  @IsNotEmpty()
  nombre_programa!: string;

  @IsString()
  descripcion!: string;

  @IsString()
  categoria!: string;

  @IsInt()
  duracion_semanas!: number;

  @IsInt()
  numero_fases!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaseDto)
  fases!: FaseDto[];
}
