import { Body, Controller, Param, Put, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "src/core/guards/auth.guard";
import { ProgramOwnershipGuard } from "./guards/program-ownership.guard";
import { ProgramasService } from "./programas.service";
import { UpdatePrerequisitosDto } from "./dto";

/**
 * Controlador para gestionar operaciones sobre proof points
 *
 * IMPORTANTE: Todos los endpoints están protegidos por AuthGuard.
 * Los endpoints que modifican proof points también están protegidos
 * por ProgramOwnershipGuard para verificar que el usuario sea el propietario del programa padre.
 */
@ApiTags("proofpoints")
@Controller("proofpoints")
@UseGuards(AuthGuard)
export class ProofPointsController {
  constructor(private readonly programasService: ProgramasService) {}

  /**
   * Actualiza los prerequisitos de un proof point.
   * Este endpoint es utilizado por el roadmap visual al crear/eliminar conectores.
   *
   * Los prerequisitos son otros proof points que deben completarse antes
   * de que el estudiante pueda acceder a este proof point.
   *
   * PROTEGIDO: Solo el creador del programa padre puede modificar los prerequisitos
   *
   * @param id - ID del proof point (sin el prefijo "proof_point:")
   * @param updatePrerequisitosDto - DTO con el array de IDs de prerequisitos
   * @returns Objeto indicando el éxito de la operación
   */
  @Put(":id/prerequisitos")
  @UseGuards(ProgramOwnershipGuard)
  @ApiOperation({
    summary: "Actualizar prerequisitos de un proof point",
    description:
      "Actualiza la lista de proof points que son prerequisitos. Utilizado por el drag-and-drop de conectores en el roadmap visual.",
  })
  @ApiResponse({
    status: 200,
    description: "Prerequisitos actualizados exitosamente",
    schema: {
      type: "object",
      properties: {
        success: { type: "boolean", example: true },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description:
      "IDs inválidos (no tienen formato proof_point:id) o datos incorrectos",
  })
  @ApiResponse({
    status: 401,
    description: "No autenticado",
  })
  @ApiResponse({
    status: 404,
    description: "Proof point no encontrado",
  })
  @ApiResponse({
    status: 500,
    description: "Error interno del servidor",
  })
  async updatePrerequisitos(
    @Param("id") id: string,
    @Body() updatePrerequisitosDto: UpdatePrerequisitosDto,
  ): Promise<{ success: boolean }> {
    return this.programasService.updatePrerequisitos(
      id,
      updatePrerequisitosDto,
    );
  }
}
