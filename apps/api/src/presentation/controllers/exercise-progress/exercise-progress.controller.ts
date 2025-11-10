import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SurrealDbService } from '../../../core/database/surrealdb.service';
import {
  StartExerciseDto,
  SaveProgressDto,
  CompleteExerciseDto,
  CompleteExerciseResponseDto,
  ExerciseProgressResponseDto,
} from '../../dtos/exercise-progress';

/**
 * ExerciseProgressController
 * REST API endpoints for Exercise Progress Management (Student actions)
 */
@ApiTags('exercise-progress')
@Controller()
@ApiBearerAuth('JWT-auth')
export class ExerciseProgressController {
  private readonly logger = new Logger(ExerciseProgressController.name);

  constructor(private readonly db: SurrealDbService) {}

  /**
   * Start an exercise (mark as started)
   */
  @Post('student/exercises/:exerciseId/start')
  @ApiOperation({
    summary: 'Start an exercise',
    description: 'Mark an exercise as started by a student',
  })
  @ApiParam({
    name: 'exerciseId',
    description: 'ExerciseInstance ID',
    example: 'exercise_instance:abc123',
  })
  @ApiResponse({
    status: 201,
    description: 'Exercise started successfully',
    type: ExerciseProgressResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Exercise not found or not published' })
  async startExercise(
    @Param('exerciseId') exerciseId: string,
    @Body() startDto: StartExerciseDto,
  ): Promise<ExerciseProgressResponseDto> {
    const decodedId = decodeURIComponent(exerciseId);

    // Verify exercise is published
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
      throw new NotFoundException(`Published exercise not found: ${exerciseId}`);
    }

    // Check if progress already exists
    const checkProgressQuery = `
      SELECT * FROM exercise_progress
      WHERE exercise_instance = type::thing($exerciseId)
        AND estudiante = type::thing($estudianteId)
        AND cohorte = type::thing($cohorteId)
      LIMIT 1
    `;

    const progressResult = await this.db.query(checkProgressQuery, {
      exerciseId: decodedId,
      estudianteId: startDto.estudianteId,
      cohorteId: startDto.cohorteId,
    });

    let existingProgress: any;
    if (Array.isArray(progressResult) && progressResult.length > 0) {
      if (Array.isArray(progressResult[0]) && progressResult[0].length > 0) {
        existingProgress = progressResult[0][0];
      } else if (!Array.isArray(progressResult[0])) {
        existingProgress = progressResult[0];
      }
    }

    // If progress exists, return it
    if (existingProgress) {
      return this.mapProgressToDto(existingProgress);
    }

    // Create new progress record
    const createProgressQuery = `
      CREATE exercise_progress CONTENT {
        exercise_instance: type::thing($exerciseId),
        estudiante: type::thing($estudianteId),
        cohorte: type::thing($cohorteId),
        estado: 'en_progreso',
        porcentaje_completitud: 0,
        fecha_inicio: time::now(),
        tiempo_invertido_minutos: 0,
        numero_intentos: 1,
        created_at: time::now(),
        updated_at: time::now()
      }
    `;

    const createResult = await this.db.query(createProgressQuery, {
      exerciseId: decodedId,
      estudianteId: startDto.estudianteId,
      cohorteId: startDto.cohorteId,
    });

    let newProgress: any;
    if (Array.isArray(createResult) && createResult.length > 0) {
      if (Array.isArray(createResult[0]) && createResult[0].length > 0) {
        newProgress = createResult[0][0];
      } else if (!Array.isArray(createResult[0])) {
        newProgress = createResult[0];
      }
    }

    if (!newProgress) {
      throw new BadRequestException('Failed to create progress record');
    }

    return this.mapProgressToDto(newProgress);
  }

  /**
   * Save exercise progress
   */
  @Put('student/exercises/:exerciseId/progress')
  @ApiOperation({
    summary: 'Save exercise progress',
    description: 'Save current progress and student work data',
  })
  @ApiParam({
    name: 'exerciseId',
    description: 'ExerciseInstance ID',
    example: 'exercise_instance:abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress saved successfully',
    type: ExerciseProgressResponseDto,
  })
  async saveProgress(
    @Param('exerciseId') exerciseId: string,
    @Body() saveDto: SaveProgressDto,
  ): Promise<ExerciseProgressResponseDto> {
    const decodedId = decodeURIComponent(exerciseId);

    // Get existing progress
    const getProgressQuery = `
      SELECT * FROM exercise_progress
      WHERE exercise_instance = type::thing($exerciseId)
        AND estudiante = type::thing($estudianteId)
        AND cohorte = type::thing($cohorteId)
      LIMIT 1
    `;

    const progressResult = await this.db.query(getProgressQuery, {
      exerciseId: decodedId,
      estudianteId: saveDto.estudianteId,
      cohorteId: saveDto.cohorteId,
    });

    let progress: any;
    if (Array.isArray(progressResult) && progressResult.length > 0) {
      if (Array.isArray(progressResult[0]) && progressResult[0].length > 0) {
        progress = progressResult[0][0];
      } else if (!Array.isArray(progressResult[0])) {
        progress = progressResult[0];
      }
    }

    if (!progress) {
      throw new NotFoundException('Progress record not found. Start the exercise first.');
    }

    // Update progress
    const updateQuery = `
      UPDATE type::thing($progressId) SET
        porcentaje_completitud = $porcentaje,
        tiempo_invertido_minutos = $tiempo,
        datos_guardados = $datos,
        updated_at = time::now()
      RETURN AFTER
    `;

    const updateResult = await this.db.query(updateQuery, {
      progressId: progress.id,
      porcentaje: saveDto.porcentajeCompletitud ?? progress.porcentaje_completitud,
      tiempo: saveDto.tiempoInvertidoMinutos ?? progress.tiempo_invertido_minutos,
      datos: saveDto.datos ?? progress.datos_guardados ?? {},
    });

    let updatedProgress: any;
    if (Array.isArray(updateResult) && updateResult.length > 0) {
      if (Array.isArray(updateResult[0]) && updateResult[0].length > 0) {
        updatedProgress = updateResult[0][0];
      } else if (!Array.isArray(updateResult[0])) {
        updatedProgress = updateResult[0];
      }
    }

    if (!updatedProgress) {
      throw new BadRequestException('Failed to update progress');
    }

    return this.mapProgressToDto(updatedProgress);
  }

  /**
   * Complete an exercise
   */
  @Post('student/exercises/:exerciseId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete an exercise',
    description: 'Mark exercise as completed and submit final work',
  })
  @ApiParam({
    name: 'exerciseId',
    description: 'ExerciseInstance ID',
    example: 'exercise_instance:abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Exercise completed successfully',
    type: CompleteExerciseResponseDto,
  })
  async completeExercise(
    @Param('exerciseId') exerciseId: string,
    @Body() completeDto: CompleteExerciseDto,
  ): Promise<CompleteExerciseResponseDto> {
    const decodedId = decodeURIComponent(exerciseId);

    // Get existing progress
    const getProgressQuery = `
      SELECT * FROM exercise_progress
      WHERE exercise_instance = type::thing($exerciseId)
        AND estudiante = type::thing($estudianteId)
        AND cohorte = type::thing($cohorteId)
      LIMIT 1
    `;

    const progressResult = await this.db.query(getProgressQuery, {
      exerciseId: decodedId,
      estudianteId: completeDto.estudianteId,
      cohorteId: completeDto.cohorteId,
    });

    let progress: any;
    if (Array.isArray(progressResult) && progressResult.length > 0) {
      if (Array.isArray(progressResult[0]) && progressResult[0].length > 0) {
        progress = progressResult[0][0];
      } else if (!Array.isArray(progressResult[0])) {
        progress = progressResult[0];
      }
    }

    if (!progress) {
      throw new NotFoundException('Progress record not found. Start the exercise first.');
    }

    // Update to completed
    const updateQuery = `
      UPDATE type::thing($progressId) SET
        estado = 'completado',
        porcentaje_completitud = 100,
        fecha_completado = time::now(),
        tiempo_invertido_minutos = $tiempo,
        score_final = $score,
        datos_guardados = $datos,
        updated_at = time::now()
      RETURN AFTER
    `;

    const updateResult = await this.db.query(updateQuery, {
      progressId: progress.id,
      tiempo: completeDto.tiempoInvertidoMinutos ?? progress.tiempo_invertido_minutos,
      score: completeDto.scoreFinal ?? null,
      datos: completeDto.datos,
    });

    let completedProgress: any;
    if (Array.isArray(updateResult) && updateResult.length > 0) {
      if (Array.isArray(updateResult[0]) && updateResult[0].length > 0) {
        completedProgress = updateResult[0][0];
      } else if (!Array.isArray(updateResult[0])) {
        completedProgress = updateResult[0];
      }
    }

    if (!completedProgress) {
      throw new BadRequestException('Failed to complete exercise');
    }

    return {
      id: completedProgress.id,
      estado: completedProgress.estado,
      scoreFinal: completedProgress.score_final,
      feedback: 'Excelente trabajo. Has completado el ejercicio exitosamente.', // TODO: Generate AI feedback
      completado: true,
    };
  }

  /**
   * Get exercise progress for a student
   */
  @Get('student/exercises/:exerciseId/progress')
  @ApiOperation({
    summary: 'Get exercise progress',
    description: 'Get current progress for a student on a specific exercise',
  })
  @ApiParam({
    name: 'exerciseId',
    description: 'ExerciseInstance ID',
    example: 'exercise_instance:abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress information',
    type: ExerciseProgressResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Progress not found' })
  async getProgress(
    @Param('exerciseId') exerciseId: string,
    @Body() body: { estudianteId: string; cohorteId: string },
  ): Promise<ExerciseProgressResponseDto> {
    const decodedId = decodeURIComponent(exerciseId);

    const query = `
      SELECT * FROM exercise_progress
      WHERE exercise_instance = type::thing($exerciseId)
        AND estudiante = type::thing($estudianteId)
        AND cohorte = type::thing($cohorteId)
      LIMIT 1
    `;

    const result = await this.db.query(query, {
      exerciseId: decodedId,
      estudianteId: body.estudianteId,
      cohorteId: body.cohorteId,
    });

    let progress: any;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        progress = result[0][0];
      } else if (!Array.isArray(result[0])) {
        progress = result[0];
      }
    }

    if (!progress) {
      throw new NotFoundException('Progress not found');
    }

    return this.mapProgressToDto(progress);
  }

  /**
   * Helper to map database record to DTO
   */
  private mapProgressToDto(progress: any): ExerciseProgressResponseDto {
    return {
      id: progress.id,
      exerciseInstance: progress.exercise_instance,
      estudiante: progress.estudiante,
      cohorte: progress.cohorte,
      estado: progress.estado,
      porcentajeCompletitud: progress.porcentaje_completitud,
      fechaInicio: progress.fecha_inicio,
      fechaCompletado: progress.fecha_completado,
      tiempoInvertidoMinutos: progress.tiempo_invertido_minutos,
      numeroIntentos: progress.numero_intentos,
      scoreFinal: progress.score_final,
      datosGuardados: progress.datos_guardados,
      createdAt: progress.created_at,
      updatedAt: progress.updated_at,
    };
  }
}
