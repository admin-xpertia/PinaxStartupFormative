import {
  Controller,
  Get,
  Param,
  NotFoundException,
  Logger,
  Inject,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { IExerciseTemplateRepository } from '../../../domain/exercise-catalog/repositories/IExerciseTemplateRepository';
import { RecordId } from '../../../domain/shared/value-objects/RecordId';
import { ExerciseCategory } from '../../../domain/exercise-catalog/value-objects/ExerciseCategory';
import { ExerciseTemplateResponseDto } from '../../dtos/exercise-catalog';

/**
 * ExerciseTemplateController
 * REST API endpoints for Exercise Template Management
 */
@ApiTags('exercise-templates')
@Controller('exercise-templates')
@ApiBearerAuth('JWT-auth')
export class ExerciseTemplateController {
  private readonly logger = new Logger(ExerciseTemplateController.name);

  constructor(
    @Inject('IExerciseTemplateRepository')
    private readonly templateRepository: IExerciseTemplateRepository,
  ) {}

  /**
   * List all exercise templates
   */
  @Get()
  @ApiOperation({
    summary: 'List all exercise templates',
    description: 'Get all available exercise templates from the catalog',
  })
  @ApiResponse({
    status: 200,
    description: 'List of exercise templates',
    type: [ExerciseTemplateResponseDto],
  })
  async listTemplates(): Promise<ExerciseTemplateResponseDto[]> {
    const templates = await this.templateRepository.findAll();
    return templates.map(t => this.mapToResponseDto(t));
  }

  /**
   * Get exercise templates grouped by category
   */
  @Get('grouped')
  @ApiOperation({
    summary: 'Get templates grouped by category',
    description: 'Get all exercise templates organized by category',
  })
  @ApiResponse({
    status: 200,
    description: 'Templates grouped by category',
  })
  async getTemplatesGrouped(): Promise<{ data: Record<string, ExerciseTemplateResponseDto[]> }> {
    const templates = await this.templateRepository.findAll();
    const grouped: Record<string, ExerciseTemplateResponseDto[]> = {};

    for (const template of templates) {
      const dto = this.mapToResponseDto(template);
      const category = dto.categoria;

      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(dto);
    }

    return { data: grouped };
  }

  /**
   * Get exercise template by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get exercise template by ID',
    description: 'Retrieve detailed information about a specific exercise template',
  })
  @ApiParam({
    name: 'id',
    description: 'ExerciseTemplate ID',
    example: 'exercise_template:crear-primera-variable',
  })
  @ApiResponse({
    status: 200,
    description: 'ExerciseTemplate details',
    type: ExerciseTemplateResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ExerciseTemplate not found' })
  async getTemplate(@Param('id') id: string): Promise<ExerciseTemplateResponseDto> {
    const template = await this.templateRepository.findById(RecordId.fromString(id));

    if (!template) {
      throw new NotFoundException(`ExerciseTemplate not found: ${id}`);
    }

    return this.mapToResponseDto(template);
  }

  /**
   * Get exercise templates by category
   */
  @Get('category/:category')
  @ApiOperation({
    summary: 'Get templates by category',
    description: 'Filter exercise templates by category',
  })
  @ApiParam({
    name: 'category',
    description: 'Exercise category',
    enum: ['leccion_interactiva', 'cuaderno_trabajo', 'simulacion_interaccion', 'mentor_asesor_ia', 'herramienta_analisis', 'herramienta_creacion', 'sistema_tracking', 'herramienta_revision', 'simulador_entorno', 'sistema_progresion'],
    example: 'leccion_interactiva',
  })
  @ApiResponse({
    status: 200,
    description: 'List of templates in category',
    type: [ExerciseTemplateResponseDto],
  })
  async getTemplatesByCategory(
    @Param('category') category: string,
  ): Promise<ExerciseTemplateResponseDto[]> {
    const exerciseCategory = ExerciseCategory.create(category as any);
    const templates = await this.templateRepository.findByCategory(exerciseCategory);
    return templates.map(t => this.mapToResponseDto(t));
  }

  /**
   * Helper method to map domain entity to DTO
   */
  private mapToResponseDto(template: any): ExerciseTemplateResponseDto {
    return {
      id: template.getId().toString(),
      nombre: template.getNombre(),
      categoria: template.getCategoria().getValue(),
      descripcion: template.getDescripcion(),
      objetivoPedagogico: template.getObjetivoPedagogico(),
      rolIA: template.getRolIA(),
      configuracionSchema: template.getConfiguracionSchema().toJSON(),
      configuracionDefault: template.getConfiguracionDefault(),
      promptTemplate: template.getPromptTemplate(),
      outputSchema: template.getOutputSchema(),
      previewConfig: template.getPreviewConfig(),
      icono: template.getIcono(),
      color: template.getColor(),
      esOficial: template.isOficial(),
      activo: template.isActivo(),
      createdAt: template.getCreatedAt().toISOString(),
      updatedAt: template.getUpdatedAt().toISOString(),
    };
  }
}
