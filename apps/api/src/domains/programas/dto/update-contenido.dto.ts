import { IsObject, IsNotEmpty } from "class-validator";

/**
 * DTO para actualizar el contenido de un componente.
 *
 * Este DTO acepta cualquier estructura JSON ya que el contenido
 * es polimórfico según el tipo de componente:
 * - Lección: { markdown: string, palabras_estimadas: number, ... }
 * - Cuaderno: { secciones: [...] }
 * - Simulación: { personaje: {...}, escenario_inicial: string, ... }
 * - Herramienta: { nombre_herramienta: string, pasos: [...], ... }
 */
export class UpdateContenidoDto {
  @IsObject()
  @IsNotEmpty()
  contenido!: Record<string, any>; // El JSON polimórfico del editor
}
