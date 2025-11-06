import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ExerciseTemplatesService, GetTemplatesFilters } from './exercise-templates.service';
import { ExerciseCategory } from '@repo/database/types';

// TODO: Importar guards de autenticación cuando estén disponibles
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('exercise-templates')
// @UseGuards(JwtAuthGuard) // Descomentar cuando esté disponible
export class ExerciseTemplatesController {
  private readonly logger = new Logger(ExerciseTemplatesController.name);

  constructor(
    private readonly templatesService: ExerciseTemplatesService,
  ) {}

  /**
   * GET /exercise-templates
   * Obtiene todos los templates de ejercicios disponibles.
   *
   * Query params opcionales:
   * - categoria: Filtrar por categoría específica
   * - esOficial: Filtrar por templates oficiales (true/false)
   * - activo: Filtrar por templates activos (true/false, default: true)
   */
  @Get()
  async getAllTemplates(
    @Query('categoria') categoria?: ExerciseCategory,
    @Query('esOficial') esOficial?: string,
    @Query('activo') activo?: string,
  ) {
    const filtros: GetTemplatesFilters = {};

    if (categoria) {
      filtros.categoria = categoria;
    }

    if (esOficial !== undefined) {
      filtros.esOficial = esOficial === 'true';
    }

    if (activo !== undefined) {
      filtros.activo = activo === 'true';
    }

    const templates = await this.templatesService.getAllTemplates(filtros);

    return {
      success: true,
      data: templates,
      count: templates.length,
    };
  }

  /**
   * GET /exercise-templates/grouped
   * Obtiene los templates agrupados por categoría.
   * Útil para mostrar la biblioteca organizada en la UI.
   */
  @Get('grouped')
  async getTemplatesGrouped() {
    const grouped = await this.templatesService.getTemplatesGroupedByCategory();

    return {
      success: true,
      data: grouped,
    };
  }

  /**
   * GET /exercise-templates/:id
   * Obtiene un template específico por su ID.
   */
  @Get(':id')
  async getTemplateById(@Param('id') id: string) {
    const template = await this.templatesService.getTemplateById(id);

    return {
      success: true,
      data: template,
    };
  }
}
