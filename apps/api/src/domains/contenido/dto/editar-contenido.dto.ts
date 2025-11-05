import { IsNotEmpty, IsString, IsObject, IsOptional } from 'class-validator';

/**
 * DTO para editar el contenido de un componente.
 * Incluye la descripción de cambios para el versionamiento.
 */
export class EditarContenidoDto {
  @IsNotEmpty()
  @IsString()
  componenteId!: string;

  @IsNotEmpty()
  @IsObject()
  contenido!: Record<string, any>;

  @IsOptional()
  @IsString()
  cambiosDescripcion?: string;

  @IsOptional()
  @IsString()
  tipoCambio?: 'mayor' | 'menor' | 'patch' | 'revision';
}

/**
 * DTO para publicar contenido.
 * Cambia el estado de 'draft' a 'publicado'.
 */
export class PublicarContenidoDto {
  @IsNotEmpty()
  @IsString()
  componenteContenidoId!: string;
}

/**
 * DTO para restaurar una versión anterior del contenido.
 */
export class RestaurarVersionDto {
  @IsNotEmpty()
  @IsString()
  componenteId!: string;

  @IsNotEmpty()
  @IsString()
  versionId!: string;

  @IsOptional()
  @IsString()
  razon?: string;
}
