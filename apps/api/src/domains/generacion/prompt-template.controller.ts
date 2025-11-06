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
import { PromptTemplateService } from "./prompt-template.service";
import {
  CrearPromptTemplateDto,
  ActualizarPromptTemplateDto,
  BuscarPromptTemplatesDto,
} from "./dto";

/**
 * Controlador para la gestión de plantillas de prompts.
 *
 * Endpoints:
 * - POST /prompt-templates - Crea una nueva plantilla
 * - GET /prompt-templates - Lista todas las plantillas (con filtros opcionales)
 * - GET /prompt-templates/:id - Obtiene una plantilla específica
 * - PUT /prompt-templates/:id - Actualiza una plantilla
 * - DELETE /prompt-templates/:id - Elimina una plantilla
 * - POST /prompt-templates/:id/renderizar - Renderiza una plantilla con variables
 * - POST /prompt-templates/:id/clonar - Clona una plantilla
 */
@Controller("prompt-templates")
// @UseGuards(JwtAuthGuard) // TODO: Descomentar cuando se implemente autenticación
export class PromptTemplateController {
  constructor(private readonly promptTemplateService: PromptTemplateService) {}

  /**
   * Crea una nueva plantilla de prompt.
   *
   * Body:
   * {
   *   "nombre": "Lección de Introducción",
   *   "descripcion": "Plantilla para lecciones introductorias",
   *   "tipoComponente": "leccion",
   *   "promptTemplate": "Genera una lección sobre {{ tema }} para {{ programa_nombre }}",
   *   "configDefault": { "modelo_ia": "gpt-4o-mini", "temperatura": 0.7 },
   *   "autor": "Instructor Juan",
   *   "esOficial": false
   * }
   */
  @Post()
  async crearPlantilla(
    @Body() dto: CrearPromptTemplateDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || "user:system"; // TODO: Obtener del JWT
    return this.promptTemplateService.crearPlantilla(dto, userId);
  }

  /**
   * Busca plantillas con filtros opcionales.
   *
   * Query params:
   * - tipoComponente: 'leccion' | 'cuaderno' | 'simulacion' | 'herramienta'
   * - esOficial: true | false
   *
   * Ejemplo: GET /prompt-templates?tipoComponente=leccion&esOficial=true
   */
  @Get()
  async buscarPlantillas(@Query() filtros: BuscarPromptTemplatesDto) {
    return this.promptTemplateService.buscarPlantillas(filtros);
  }

  /**
   * Obtiene una plantilla específica por su ID.
   */
  @Get(":id")
  async obtenerPlantilla(@Param("id") plantillaId: string) {
    return this.promptTemplateService.obtenerPlantilla(plantillaId);
  }

  /**
   * Actualiza una plantilla existente.
   *
   * Solo el creador o un admin puede actualizar la plantilla.
   */
  @Put(":id")
  async actualizarPlantilla(
    @Param("id") plantillaId: string,
    @Body() dto: ActualizarPromptTemplateDto,
    @Request() req: any,
  ) {
    const userId = req.user?.id || "user:system"; // TODO: Obtener del JWT
    return this.promptTemplateService.actualizarPlantilla(
      plantillaId,
      dto,
      userId,
    );
  }

  /**
   * Elimina una plantilla.
   *
   * Solo el creador o un admin puede eliminar la plantilla.
   * Las plantillas oficiales no pueden ser eliminadas.
   */
  @Delete(":id")
  async eliminarPlantilla(
    @Param("id") plantillaId: string,
    @Request() req: any,
  ) {
    const userId = req.user?.id || "user:system"; // TODO: Obtener del JWT
    return this.promptTemplateService.eliminarPlantilla(plantillaId, userId);
  }

  /**
   * Renderiza una plantilla reemplazando las variables con valores reales.
   *
   * Body:
   * {
   *   "variables": {
   *     "programa_nombre": "Curso de TypeScript",
   *     "tema": "Interfaces y Tipos",
   *     "nivel_nombre": "Nivel 1"
   *   }
   * }
   *
   * Response: El prompt renderizado como string
   */
  @Post(":id/renderizar")
  async renderizarPlantilla(
    @Param("id") plantillaId: string,
    @Body("variables") variables: Record<string, any>,
  ) {
    const promptRenderizado =
      await this.promptTemplateService.renderizarPlantilla(
        plantillaId,
        variables,
      );

    return {
      plantillaId,
      promptRenderizado,
    };
  }

  /**
   * Clona una plantilla existente para que el usuario pueda modificarla.
   *
   * Body (opcional):
   * {
   *   "nuevoNombre": "Mi copia de la plantilla"
   * }
   */
  @Post(":id/clonar")
  async clonarPlantilla(
    @Param("id") plantillaId: string,
    @Body("nuevoNombre") nuevoNombre: string | undefined,
    @Request() req: any,
  ) {
    const userId = req.user?.id || "user:system"; // TODO: Obtener del JWT
    return this.promptTemplateService.clonarPlantilla(
      plantillaId,
      userId,
      nuevoNombre,
    );
  }
}
