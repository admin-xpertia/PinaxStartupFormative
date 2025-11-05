import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsInt, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

/**
 * DTO para un item individual a actualizar
 */
export class OrdenItemDto {
  @ApiProperty({
    description:
      'ID completo del elemento (con prefijo de tabla, ej: "fase:abc", "proofpoint:xyz")',
    example: "fase:abc123",
  })
  @IsString()
  id!: string;

  @ApiProperty({
    description: "Nuevo valor de orden para el elemento",
    example: 1,
  })
  @IsInt()
  orden!: number;
}

/**
 * DTO para actualizar el orden de múltiples elementos de la arquitectura
 * Utilizado por el drag-and-drop del roadmap visual
 */
export class UpdateOrdenDto {
  @ApiProperty({
    description: "Array de items a actualizar con sus nuevos valores de orden",
    type: [OrdenItemDto],
    example: [
      { id: "fase:abc", orden: 1 },
      { id: "fase:def", orden: 2 },
      { id: "proofpoint:xyz", orden: 1 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrdenItemDto)
  items!: OrdenItemDto[];
}
