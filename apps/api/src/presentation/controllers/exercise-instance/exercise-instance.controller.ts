import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
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
import { AddExerciseToProofPointUseCase } from '../../../application/exercise-instance/use-cases/AddExerciseToProofPoint/AddExerciseToProofPointUseCase';
import { GenerateExerciseContentUseCase } from '../../../application/exercise-instance/use-cases/GenerateExerciseContent/GenerateExerciseContentUseCase';
import { IExerciseInstanceRepository } from '../../../domain/exercise-instance/repositories/IExerciseInstanceRepository';
import { RecordId } from '../../../domain/shared/value-objects/RecordId';
import { AddExerciseToProofPointRequestDto, ExerciseInstanceResponseDto, GenerateContentRequestDto, GenerateContentResponseDto } from '../../dtos/exercise-instance';
import { SurrealDbService } from '../../../core/database/surrealdb.service';

/**
 * ExerciseInstanceController
 * REST API endpoints for Exercise Instance Management
 */
@ApiTags('exercise-instances')
@Controller()
@ApiBearerAuth('JWT-auth')
export class ExerciseInstanceController {
  private readonly logger = new Logger(ExerciseInstanceController.name);

  constructor(
    private readonly addExerciseUseCase: AddExerciseToProofPointUseCase,
    private readonly generateContentUseCase: GenerateExerciseContentUseCase,
    @Inject('IExerciseInstanceRepository')
    private readonly exerciseInstanceRepository: IExerciseInstanceRepository,
    private readonly db: SurrealDbService,
  ) {}

  /**
   * Add exercise to proof point
   */
  @Post('proof-points/:proofPointId/exercises')
  @ApiOperation({
    summary: 'Add exercise to proof point',
    description: 'Creates a new exercise instance within a proof point',
  })
  @ApiParam({
    name: 'proofPointId',
    description: 'ProofPoint ID',
    example: 'proof_point:abc123',
  })
  @ApiResponse({
    status: 201,
    description: 'Exercise created successfully',
    type: ExerciseInstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ProofPoint or Template not found' })
  @ApiResponse({ status: 400, description: 'Invalid configuration' })
  async addExercise(
    @Param('proofPointId') proofPointId: string,
    @Body() addExerciseDto: AddExerciseToProofPointRequestDto,
  ): Promise<ExerciseInstanceResponseDto> {
    const decodedProofPointId = decodeURIComponent(proofPointId);

    const result = await this.addExerciseUseCase.execute({
      proofPointId: decodedProofPointId,
      templateId: addExerciseDto.templateId,
      nombre: addExerciseDto.nombre,
      duracionMinutos: addExerciseDto.duracionEstimadaMinutos,
      consideraciones: addExerciseDto.consideracionesContexto,
      configuracion: addExerciseDto.configuracionPersonalizada,
    });

    return result.match({
      ok: async (response) => {
        // Query the exercise directly from database to avoid mapper issues
        const query = 'SELECT * FROM type::thing($id)';
        const dbResult = await this.db.query(query, { id: response.exerciseInstanceId });

        let exercise: any;
        if (Array.isArray(dbResult) && dbResult.length > 0) {
          if (Array.isArray(dbResult[0]) && dbResult[0].length > 0) {
            exercise = dbResult[0][0];
          } else if (!Array.isArray(dbResult[0])) {
            exercise = dbResult[0];
          }
        }

        if (!exercise) {
          throw new NotFoundException(`Exercise not found: ${response.exerciseInstanceId}`);
        }

        // Map manually to DTO
        return {
          id: exercise.id,
          template: exercise.template,
          proofPoint: exercise.proof_point,
          nombre: exercise.nombre,
          descripcionBreve: exercise.descripcion_breve,
          consideracionesContexto: exercise.consideraciones_contexto,
          configuracionPersonalizada: exercise.configuracion_personalizada,
          orden: exercise.orden,
          duracionEstimadaMinutos: exercise.duracion_estimada_minutos,
          estadoContenido: exercise.estado_contenido,
          contenidoActual: exercise.contenido_actual,
          esObligatorio: exercise.es_obligatorio,
          createdAt: exercise.created_at,
          updatedAt: exercise.updated_at,
        };
      },
      fail: (error) => {
        if (error.message.includes('not found')) {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      },
    });
  }

  /**
   * List exercises by proof point
   */
  @Get('proof-points/:proofPointId/exercises')
  @ApiOperation({
    summary: 'List proof point exercises',
    description: 'Get all exercises for a specific proof point',
  })
  @ApiParam({
    name: 'proofPointId',
    description: 'ProofPoint ID',
    example: 'proof_point:abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'List of exercises',
    type: [ExerciseInstanceResponseDto],
  })
  async listExercisesByProofPoint(
    @Param('proofPointId') proofPointId: string,
  ): Promise<ExerciseInstanceResponseDto[]> {
    const decodedProofPointId = decodeURIComponent(proofPointId);

    // Query database directly
    const query = `
      SELECT * FROM exercise_instance
      WHERE proof_point = type::thing($proofPointId)
      ORDER BY orden ASC
    `;

    const result = await this.db.query(query, {
      proofPointId: decodedProofPointId,
    });

    // Extract exercises
    let exercises: any[];
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0])) {
        exercises = result[0];
      } else {
        exercises = result;
      }
    } else {
      exercises = [];
    }

    // Map to DTOs
    return exercises.map((exercise: any) => ({
      id: exercise.id,
      template: exercise.template,
      proofPoint: exercise.proof_point,
      nombre: exercise.nombre,
      descripcionBreve: exercise.descripcion_breve,
      consideracionesContexto: exercise.consideraciones_contexto,
      configuracionPersonalizada: exercise.configuracion_personalizada,
      orden: exercise.orden,
      duracionEstimadaMinutos: exercise.duracion_estimada_minutos,
      estadoContenido: exercise.estado_contenido,
      contenidoActual: exercise.contenido_actual,
      esObligatorio: exercise.es_obligatorio,
      createdAt: exercise.created_at,
      updatedAt: exercise.updated_at,
    }));
  }

  /**
   * Get exercise by ID
   */
  @Get('exercises/:id')
  @ApiOperation({
    summary: 'Get exercise by ID',
    description: 'Retrieve detailed information about a specific exercise instance',
  })
  @ApiParam({
    name: 'id',
    description: 'ExerciseInstance ID',
    example: 'exercise_instance:abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Exercise details',
    type: ExerciseInstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  async getExercise(@Param('id') id: string): Promise<ExerciseInstanceResponseDto> {
    const decodedId = decodeURIComponent(id);

    // Query database directly
    const result = await this.db.query(
      'SELECT * FROM type::thing($id)',
      { id: decodedId }
    );

    let exercise: any;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        exercise = result[0][0];
      } else if (!Array.isArray(result[0])) {
        exercise = result[0];
      }
    }

    if (!exercise) {
      throw new NotFoundException(`Exercise not found: ${id}`);
    }

    return {
      id: exercise.id,
      template: exercise.template,
      proofPoint: exercise.proof_point,
      nombre: exercise.nombre,
      descripcionBreve: exercise.descripcion_breve,
      consideracionesContexto: exercise.consideraciones_contexto,
      configuracionPersonalizada: exercise.configuracion_personalizada,
      orden: exercise.orden,
      duracionEstimadaMinutos: exercise.duracion_estimada_minutos,
      estadoContenido: exercise.estado_contenido,
      contenidoActual: exercise.contenido_actual,
      esObligatorio: exercise.es_obligatorio,
      createdAt: exercise.created_at,
      updatedAt: exercise.updated_at,
    };
  }

  /**
   * Generate AI content for exercise
   */
  @Post('exercises/:id/generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate AI content',
    description: 'Generates AI-powered content for an exercise instance using GPT',
  })
  @ApiParam({
    name: 'id',
    description: 'ExerciseInstance ID',
    example: 'exercise_instance:abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Content generated successfully',
    type: GenerateContentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  @ApiResponse({ status: 400, description: 'Content generation failed' })
  async generateContent(
    @Param('id') id: string,
    @Body() generateDto: GenerateContentRequestDto,
  ): Promise<GenerateContentResponseDto> {
    const result = await this.generateContentUseCase.execute({
      exerciseInstanceId: id,
      forceRegenerate: generateDto.forceRegenerate,
    });

    return result.match({
      ok: (response) => ({
        exerciseInstanceId: response.exerciseInstanceId,
        contentId: response.contentId,
        status: response.status,
        contentPreview: response.contentPreview,
        tokensUsed: response.tokensUsed,
        generatedAt: response.generatedAt,
      }),
      fail: (error) => {
        if (error.message.includes('not found')) {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      },
    });
  }

  /**
   * Get exercise content
   */
  @Get('exercises/:id/content')
  @ApiOperation({
    summary: 'Get exercise content',
    description: 'Get the generated AI content for an exercise instance',
  })
  @ApiParam({
    name: 'id',
    description: 'ExerciseInstance ID',
    example: 'exercise_instance:abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Exercise content',
  })
  @ApiResponse({ status: 404, description: 'Exercise or content not found' })
  async getExerciseContent(@Param('id') id: string): Promise<any> {
    const decodedId = decodeURIComponent(id);

    // Query exercise content from database
    const query = `
      SELECT * FROM exercise_content
      WHERE exercise_instance = type::thing($exerciseId)
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const result = await this.db.query(query, {
      exerciseId: decodedId,
    });

    let content: any;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        content = result[0][0];
      } else if (!Array.isArray(result[0])) {
        content = result[0];
      }
    }

    if (!content) {
      throw new NotFoundException(`Content not found for exercise: ${id}`);
    }

    return {
      id: content.id,
      exercise_instance: content.exercise_instance,
      contenido_generado: content.contenido_generado,
      prompt_usado: content.prompt_usado,
      modelo: content.modelo,
      created_at: content.created_at,
      updated_at: content.updated_at,
    };
  }

  /**
   * Delete exercise
   */
  @Delete('exercises/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete exercise',
    description: 'Permanently delete an exercise instance',
  })
  @ApiParam({
    name: 'id',
    description: 'ExerciseInstance ID',
    example: 'exercise_instance:abc123',
  })
  @ApiResponse({ status: 204, description: 'Exercise deleted successfully' })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  async deleteExercise(@Param('id') id: string): Promise<void> {
    const deleted = await this.exerciseInstanceRepository.delete(RecordId.fromString(id));

    if (!deleted) {
      throw new NotFoundException(`Exercise not found: ${id}`);
    }
  }

  /**
   * Helper method to map domain entity to DTO
   */
  private mapToResponseDto(exercise: any): ExerciseInstanceResponseDto {
    return {
      id: exercise.getId().toString(),
      template: exercise.getTemplate().toString(),
      proofPoint: exercise.getProofPoint().toString(),
      nombre: exercise.getNombre(),
      descripcionBreve: exercise.getDescripcionBreve(),
      consideracionesContexto: exercise.getConsideracionesContexto(),
      configuracionPersonalizada: exercise.getConfiguracionPersonalizada(),
      orden: exercise.getOrden(),
      duracionEstimadaMinutos: exercise.getDuracionEstimadaMinutos(),
      estadoContenido: exercise.getEstadoContenido().getValue(),
      contenidoActual: exercise.getContenidoActual()?.toString(),
      esObligatorio: exercise.isObligatorio(),
      createdAt: exercise.getCreatedAt().toISOString(),
      updatedAt: exercise.getUpdatedAt().toISOString(),
    };
  }
}
