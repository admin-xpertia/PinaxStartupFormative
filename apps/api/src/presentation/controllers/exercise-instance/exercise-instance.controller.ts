import {
  Controller,
  Get,
  Post,
  Put,
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
import { AddExerciseToProofPointRequestDto, ExerciseInstanceResponseDto, GenerateContentRequestDto, GenerateContentResponseDto, UpdateExerciseStatusDto } from '../../dtos/exercise-instance';
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
   * Update exercise
   */
  @Put('exercises/:id')
  @ApiOperation({
    summary: 'Update exercise',
    description: 'Update an existing exercise instance',
  })
  @ApiParam({
    name: 'id',
    description: 'ExerciseInstance ID',
    example: 'exercise_instance:abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Exercise updated successfully',
    type: ExerciseInstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  async updateExercise(
    @Param('id') id: string,
    @Body() updateDto: AddExerciseToProofPointRequestDto,
  ): Promise<ExerciseInstanceResponseDto> {
    const decodedId = decodeURIComponent(id);

    // Update using direct database query
    const query = `
      UPDATE type::thing($id) SET
        nombre = $nombre,
        descripcion_breve = $descripcionBreve,
        consideraciones_contexto = $consideracionesContexto,
        configuracion_personalizada = $configuracionPersonalizada,
        duracion_estimada_minutos = $duracionEstimadaMinutos,
        updated_at = time::now()
      RETURN AFTER
    `;

    const result = await this.db.query(query, {
      id: decodedId,
      nombre: updateDto.nombre,
      descripcionBreve: updateDto.descripcionBreve || '',
      consideracionesContexto: updateDto.consideracionesContexto || '',
      configuracionPersonalizada: updateDto.configuracionPersonalizada || {},
      duracionEstimadaMinutos: updateDto.duracionEstimadaMinutos,
    });

    let updated: any;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        updated = result[0][0];
      } else if (!Array.isArray(result[0])) {
        updated = result[0];
      }
    }

    if (!updated) {
      throw new NotFoundException(`Exercise not found: ${id}`);
    }

    return {
      id: updated.id,
      template: updated.template,
      proofPoint: updated.proof_point,
      nombre: updated.nombre,
      descripcionBreve: updated.descripcion_breve,
      consideracionesContexto: updated.consideraciones_contexto,
      configuracionPersonalizada: updated.configuracion_personalizada,
      orden: updated.orden,
      duracionEstimadaMinutos: updated.duracion_estimada_minutos,
      estadoContenido: updated.estado_contenido,
      contenidoActual: updated.contenido_actual,
      esObligatorio: updated.es_obligatorio,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }

  /**
   * Publish exercise (change status to published)
   */
  @Put('exercises/:id/publish')
  @ApiOperation({
    summary: 'Publish exercise',
    description: 'Change exercise content status to published',
  })
  @ApiParam({
    name: 'id',
    description: 'ExerciseInstance ID',
    example: 'exercise_instance:abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Exercise published successfully',
    type: ExerciseInstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Exercise not found' })
  @ApiResponse({ status: 400, description: 'Exercise must be in draft state to publish' })
  async publishExercise(@Param('id') id: string): Promise<ExerciseInstanceResponseDto> {
    const decodedId = decodeURIComponent(id);

    // First, check if exercise exists and is in draft state
    const checkQuery = 'SELECT * FROM type::thing($id)';
    const checkResult = await this.db.query(checkQuery, { id: decodedId });

    let exercise: any;
    if (Array.isArray(checkResult) && checkResult.length > 0) {
      if (Array.isArray(checkResult[0]) && checkResult[0].length > 0) {
        exercise = checkResult[0][0];
      } else if (!Array.isArray(checkResult[0])) {
        exercise = checkResult[0];
      }
    }

    if (!exercise) {
      throw new NotFoundException(`Exercise not found: ${id}`);
    }

    if (exercise.estado_contenido !== 'draft') {
      throw new BadRequestException(
        `Exercise must be in draft state to publish. Current state: ${exercise.estado_contenido}`
      );
    }

    // Update status to published
    const updateQuery = `
      UPDATE type::thing($id) SET
        estado_contenido = 'publicado',
        updated_at = time::now()
      RETURN AFTER
    `;

    const updateResult = await this.db.query(updateQuery, { id: decodedId });

    let updated: any;
    if (Array.isArray(updateResult) && updateResult.length > 0) {
      if (Array.isArray(updateResult[0]) && updateResult[0].length > 0) {
        updated = updateResult[0][0];
      } else if (!Array.isArray(updateResult[0])) {
        updated = updateResult[0];
      }
    }

    if (!updated) {
      throw new NotFoundException(`Failed to update exercise: ${id}`);
    }

    return {
      id: updated.id,
      template: updated.template,
      proofPoint: updated.proof_point,
      nombre: updated.nombre,
      descripcionBreve: updated.descripcion_breve,
      consideracionesContexto: updated.consideraciones_contexto,
      configuracionPersonalizada: updated.configuracion_personalizada,
      orden: updated.orden,
      duracionEstimadaMinutos: updated.duracion_estimada_minutos,
      estadoContenido: updated.estado_contenido,
      contenidoActual: updated.contenido_actual,
      esObligatorio: updated.es_obligatorio,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
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
    const decodedId = decodeURIComponent(id);

    // Delete using direct database query
    const query = 'DELETE type::thing($id) RETURN BEFORE';
    const result = await this.db.query(query, { id: decodedId });

    let deleted: any;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        deleted = result[0][0];
      } else if (!Array.isArray(result[0])) {
        deleted = result[0];
      }
    }

    if (!deleted) {
      throw new NotFoundException(`Exercise not found: ${id}`);
    }
  }

  /**
   * Get published exercises for a proof point (Student endpoint)
   */
  @Get('student/proof-points/:proofPointId/exercises')
  @ApiOperation({
    summary: 'Get published exercises for students',
    description: 'Get all published exercises for a specific proof point (student view)',
  })
  @ApiParam({
    name: 'proofPointId',
    description: 'ProofPoint ID',
    example: 'proof_point:abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'List of published exercises',
    type: [ExerciseInstanceResponseDto],
  })
  async getPublishedExercisesByProofPoint(
    @Param('proofPointId') proofPointId: string,
  ): Promise<ExerciseInstanceResponseDto[]> {
    const decodedProofPointId = decodeURIComponent(proofPointId);

    // Query only published exercises
    const query = `
      SELECT * FROM exercise_instance
      WHERE proof_point = type::thing($proofPointId)
        AND estado_contenido = 'publicado'
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

    // Map to DTOs (excluding instructor-specific fields)
    return exercises.map((exercise: any) => ({
      id: exercise.id,
      template: exercise.template,
      proofPoint: exercise.proof_point,
      nombre: exercise.nombre,
      descripcionBreve: exercise.descripcion_breve,
      consideracionesContexto: '', // Don't expose to students
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
   * Get published exercise by ID (Student endpoint)
   */
  @Get('student/exercises/:id')
  @ApiOperation({
    summary: 'Get published exercise for student',
    description: 'Get a specific exercise if it is published',
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
  @ApiResponse({ status: 404, description: 'Exercise not found or not published' })
  async getPublishedExercise(@Param('id') id: string): Promise<ExerciseInstanceResponseDto> {
    const decodedId = decodeURIComponent(id);

    // Query database for published exercise only
    const query = `
      SELECT * FROM type::thing($id)
      WHERE estado_contenido = 'publicado'
    `;

    const result = await this.db.query(query, { id: decodedId });

    let exercise: any;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        exercise = result[0][0];
      } else if (!Array.isArray(result[0])) {
        exercise = result[0];
      }
    }

    if (!exercise) {
      throw new NotFoundException(`Published exercise not found: ${id}`);
    }

    return {
      id: exercise.id,
      template: exercise.template,
      proofPoint: exercise.proof_point,
      nombre: exercise.nombre,
      descripcionBreve: exercise.descripcion_breve,
      consideracionesContexto: '', // Don't expose to students
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
   * Get published exercise content (Student endpoint)
   */
  @Get('student/exercises/:id/content')
  @ApiOperation({
    summary: 'Get published exercise content for student',
    description: 'Get the content of a published exercise',
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
  async getPublishedExerciseContent(@Param('id') id: string): Promise<any> {
    const decodedId = decodeURIComponent(id);

    // First verify the exercise is published
    const exerciseQuery = `
      SELECT * FROM type::thing($id)
      WHERE estado_contenido = 'publicado'
    `;

    const exerciseResult = await this.db.query(exerciseQuery, { id: decodedId });

    let exercise: any;
    if (Array.isArray(exerciseResult) && exerciseResult.length > 0) {
      if (Array.isArray(exerciseResult[0]) && exerciseResult[0].length > 0) {
        exercise = exerciseResult[0][0];
      } else if (!Array.isArray(exerciseResult[0])) {
        exercise = exerciseResult[0];
      }
    }

    if (!exercise) {
      throw new NotFoundException(`Published exercise not found: ${id}`);
    }

    // Query exercise content
    const contentQuery = `
      SELECT * FROM exercise_content
      WHERE exercise_instance = type::thing($exerciseId)
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const contentResult = await this.db.query(contentQuery, {
      exerciseId: decodedId,
    });

    let content: any;
    if (Array.isArray(contentResult) && contentResult.length > 0) {
      if (Array.isArray(contentResult[0]) && contentResult[0].length > 0) {
        content = contentResult[0][0];
      } else if (!Array.isArray(contentResult[0])) {
        content = contentResult[0];
      }
    }

    if (!content) {
      throw new NotFoundException(`Content not found for exercise: ${id}`);
    }

    return {
      id: content.id,
      exercise_instance: content.exercise_instance,
      contenido_generado: content.contenido_generado,
      // Don't expose prompt_usado and modelo to students
      created_at: content.created_at,
      updated_at: content.updated_at,
    };
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
