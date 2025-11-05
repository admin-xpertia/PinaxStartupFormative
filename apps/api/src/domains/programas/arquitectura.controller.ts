import { Body, Controller, Patch, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "src/core/guards/auth.guard";
import { User } from "src/core/decorators";
import { ProgramasService } from "./programas.service";
import { UpdateOrdenDto } from "./dto";

/**
 * Controlador para gestionar operaciones sobre la arquitectura de programas
 * (independiente del controlador principal de programas)
 *
 * IMPORTANTE: Este controlador verifica la propiedad a nivel de servicio,
 * ya que el endpoint no tiene parámetros :id para usar el guard.
 */
@ApiTags("arquitectura")
@Controller("arquitectura")
@UseGuards(AuthGuard)
export class ArquitecturaController {
  constructor(private readonly programasService: ProgramasService) {}

  /**
   * Actualiza el orden de múltiples elementos de la arquitectura.
   * Este endpoint es utilizado por el drag-and-drop del roadmap visual.
   *
   * Ejecuta todas las actualizaciones en una transacción atómica:
   * - Si todas las actualizaciones son exitosas, se hace commit
   * - Si alguna falla, toda la transacción se revierte
   *
   * PROTEGIDO: Verifica la propiedad de cada elemento a nivel de servicio
   *
   * @param updateOrdenDto - DTO con el array de items a actualizar
   * @param userId - ID del usuario autenticado (extraído del token JWT)
   * @returns Objeto indicando el éxito y número de elementos actualizados
   */
  @Patch("ordenar")
  @ApiOperation({
    summary: "Actualizar orden de elementos de arquitectura",
    description:
      "Actualiza el campo 'orden' de múltiples elementos (fases, proof points, niveles, componentes) en una transacción atómica. Verifica que el usuario sea propietario de todos los elementos.",
  })
  @ApiResponse({
    status: 200,
    description: "Orden actualizado exitosamente",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
        updated: { type: "number", example: 5 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: "Datos inválidos (IDs sin formato correcto o array vacío)",
  })
  @ApiResponse({
    status: 401,
    description: "No autenticado",
  })
  @ApiResponse({
    status: 403,
    description: "No autorizado - No eres propietario de alguno de los elementos",
  })
  @ApiResponse({
    status: 500,
    description: "Error interno del servidor",
  })
  async updateOrden(
    @Body() updateOrdenDto: UpdateOrdenDto,
    @User("id") userId: string,
  ): Promise<{ success: boolean; updated: number }> {
    return this.programasService.updateOrdenArquitectura(
      updateOrdenDto.items,
      userId,
    );
  }
}
