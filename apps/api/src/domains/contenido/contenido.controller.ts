import {
  Controller,
  Post,
  Put,
  Get,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ContenidoEdicionService } from "./contenido-edicion.service";
import { RubricaService } from "./rubrica.service";
import {
  EditarContenidoDto,
  PublicarContenidoDto,
  RestaurarVersionDto,
  CrearRubricaDto,
  ValidarPesosDto,
} from "./dto";

/**
 * Controlador para la gestión de contenido y rúbricas.
 *
 * Endpoints:
 * - POST /contenido/editar - Edita el contenido de un componente
 * - POST /contenido/publicar - Publica contenido
 * - POST /contenido/restaurar - Restaura una versión anterior
 * - GET /contenido/historial/:componenteId - Obtiene el historial de versiones
 * - GET /contenido/comparar - Compara dos versiones
 *
 * - POST /contenido/rubrica - Crea una rúbrica
 * - GET /contenido/rubrica/:componenteId - Obtiene la rúbrica de un componente
 * - PUT /contenido/rubrica/:rubricaId - Actualiza una rúbrica
 * - DELETE /contenido/rubrica/:rubricaId - Elimina una rúbrica
 * - POST /contenido/rubrica/validar - Valida los pesos de una rúbrica
 * - POST /contenido/rubrica/evaluar/:componenteId - Evalúa usando la rúbrica
 */
@Controller("contenido")
// @UseGuards(JwtAuthGuard) // TODO: Descomentar cuando se implemente autenticación
export class ContenidoController {
  constructor(
    private readonly contenidoEdicionService: ContenidoEdicionService,
    private readonly rubricaService: RubricaService,
  ) {}

  // ============================================================================
  // ENDPOINTS DE EDICIÓN DE CONTENIDO
  // ============================================================================

  /**
   * Edita el contenido de un componente.
   *
   * Si el contenido actual está publicado, se crea automáticamente una versión
   * y un nuevo registro en estado 'draft'.
   */
  @Post("editar")
  async editarContenido(@Body() dto: EditarContenidoDto, @Request() req: any) {
    const userId = req.user?.id || "user:system"; // TODO: Obtener del JWT
    return this.contenidoEdicionService.editarContenido(dto, userId);
  }

  /**
   * Publica el contenido de un componente.
   * Cambia el estado de 'draft' a 'publicado'.
   */
  @Post("publicar")
  async publicarContenido(
    @Body() dto: PublicarContenidoDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || "user:system"; // TODO: Obtener del JWT
    return this.contenidoEdicionService.publicarContenido(dto, userId);
  }

  /**
   * Restaura una versión anterior del contenido.
   */
  @Post("restaurar")
  async restaurarVersion(
    @Body() dto: RestaurarVersionDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || "user:system"; // TODO: Obtener del JWT
    return this.contenidoEdicionService.restaurarVersion(dto, userId);
  }

  /**
   * Obtiene el historial de versiones de un componente.
   */
  @Get("historial/:componenteId")
  async obtenerHistorialVersiones(@Param("componenteId") componenteId: string) {
    return this.contenidoEdicionService.obtenerHistorialVersiones(componenteId);
  }

  /**
   * Compara dos versiones de contenido.
   */
  @Get("comparar")
  async compararVersiones(
    @Query("versionAnterior") versionAnteriorId: string,
    @Query("versionNueva") versionNuevaId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || "user:system"; // TODO: Obtener del JWT
    return this.contenidoEdicionService.compararVersiones(
      versionAnteriorId,
      versionNuevaId,
      userId,
    );
  }

  // ============================================================================
  // ENDPOINTS DE RÚBRICAS
  // ============================================================================

  /**
   * Crea una nueva rúbrica de evaluación para un componente.
   */
  @Post("rubrica")
  async crearRubrica(@Body() dto: CrearRubricaDto) {
    return this.rubricaService.crearRubrica(dto);
  }

  /**
   * Obtiene la rúbrica de un componente.
   */
  @Get("rubrica/:componenteId")
  async obtenerRubrica(@Param("componenteId") componenteId: string) {
    return this.rubricaService.obtenerRubrica(componenteId);
  }

  /**
   * Actualiza una rúbrica existente.
   */
  @Put("rubrica/:rubricaId")
  async actualizarRubrica(
    @Param("rubricaId") rubricaId: string,
    @Body() dto: Partial<CrearRubricaDto>,
  ) {
    return this.rubricaService.actualizarRubrica(rubricaId, dto);
  }

  /**
   * Elimina una rúbrica.
   */
  @Delete("rubrica/:rubricaId")
  async eliminarRubrica(@Param("rubricaId") rubricaId: string) {
    return this.rubricaService.eliminarRubrica(rubricaId);
  }

  /**
   * Valida que los pesos de las dimensiones de una rúbrica suman 100.
   */
  @Post("rubrica/validar")
  async validarPesos(@Body() dto: ValidarPesosDto) {
    return this.rubricaService.validarPesos(dto);
  }

  /**
   * Evalúa un entregable usando la rúbrica del componente.
   *
   * Body: { dimensionNombre: nivelSeleccionado }
   * Ejemplo: { "Claridad de Ideas": "Excelente", "Uso de Evidencia": "Bueno" }
   */
  @Post("rubrica/evaluar/:componenteId")
  async evaluarConRubrica(
    @Param("componenteId") componenteId: string,
    @Body() evaluacion: Record<string, string>,
  ) {
    return this.rubricaService.evaluarConRubrica(componenteId, evaluacion);
  }
}
