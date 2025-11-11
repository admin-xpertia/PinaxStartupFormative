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
import { OpenAIService } from '../../../infrastructure/ai/OpenAIService';
import {
  StartExerciseDto,
  SaveProgressDto,
  CompleteExerciseDto,
  CompleteExerciseResponseDto,
  ExerciseProgressResponseDto,
  StudentProgressSummaryDto,
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

  constructor(
    private readonly db: SurrealDbService,
    private readonly openAIService: OpenAIService,
  ) {}

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

    // Get exercise details for feedback generation
    const exerciseQuery = `SELECT * FROM type::thing($id)`;
    const exerciseResult = await this.db.query(exerciseQuery, {
      id: decodedId,
    });

    let exercise: any;
    if (Array.isArray(exerciseResult) && exerciseResult.length > 0) {
      if (Array.isArray(exerciseResult[0]) && exerciseResult[0].length > 0) {
        exercise = exerciseResult[0][0];
      } else if (!Array.isArray(exerciseResult[0])) {
        exercise = exerciseResult[0];
      }
    }

    // Generate AI feedback
    const feedback = await this.generateAIFeedback(
      exercise?.nombre || 'ejercicio',
      exercise?.template || 'general',
      completeDto.datos,
      completeDto.tiempoInvertidoMinutos || 0,
    );

    return {
      id: completedProgress.id,
      estado: completedProgress.estado,
      scoreFinal: completedProgress.score_final,
      feedback,
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
   * Get student progress summary
   */
  @Get('student/progress/summary')
  @ApiOperation({
    summary: 'Get student progress summary',
    description: 'Get overall progress statistics for a student across all exercises',
  })
  @ApiResponse({
    status: 200,
    description: 'Progress summary',
    type: StudentProgressSummaryDto,
  })
  async getProgressSummary(
    @Body() body: { estudianteId: string; cohorteId: string },
  ): Promise<StudentProgressSummaryDto> {
    // Get all progress records for student
    const progressQuery = `
      SELECT
        id,
        exercise_instance,
        estado,
        score_final,
        tiempo_invertido_minutos,
        fecha_completado
      FROM exercise_progress
      WHERE estudiante = type::thing($estudianteId)
        AND cohorte = type::thing($cohorteId)
    `;

    const progressResult = await this.db.query(progressQuery, {
      estudianteId: body.estudianteId,
      cohorteId: body.cohorteId,
    });

    let progressRecords: any[] = [];
    if (Array.isArray(progressResult) && progressResult.length > 0) {
      progressRecords = Array.isArray(progressResult[0])
        ? progressResult[0]
        : [progressResult[0]];
    }

    // Get all published exercises for the cohorte
    const exercisesQuery = `
      SELECT id, nombre, template, proof_point
      FROM exercise_instance
      WHERE estado_contenido = 'publicado'
        AND cohorte = type::thing($cohorteId)
    `;

    const exercisesResult = await this.db.query(exercisesQuery, {
      cohorteId: body.cohorteId,
    });

    let allExercises: any[] = [];
    if (Array.isArray(exercisesResult) && exercisesResult.length > 0) {
      allExercises = Array.isArray(exercisesResult[0])
        ? exercisesResult[0]
        : [exercisesResult[0]];
    }

    // Calculate overall statistics
    const completedRecords = progressRecords.filter((p) => p.estado === 'completado');
    const inProgressRecords = progressRecords.filter((p) => p.estado === 'en_progreso');

    const totalTimeInvested = progressRecords.reduce(
      (sum, p) => sum + (p.tiempo_invertido_minutos || 0),
      0,
    );

    const scoresWithValues = completedRecords
      .filter((p) => p.score_final !== null && p.score_final !== undefined)
      .map((p) => p.score_final);

    const averageScore =
      scoresWithValues.length > 0
        ? scoresWithValues.reduce((sum, s) => sum + s, 0) / scoresWithValues.length
        : null;

    // Get proof point names
    const proofPointIds = [...new Set(allExercises.map((e) => e.proof_point))];
    const proofPointsQuery = `
      SELECT id, nombre
      FROM proof_point
      WHERE id IN [${proofPointIds.map((id) => `type::thing('${id}')`).join(', ')}]
    `;

    const proofPointsResult = await this.db.query(proofPointsQuery);
    let proofPoints: any[] = [];
    if (Array.isArray(proofPointsResult) && proofPointsResult.length > 0) {
      proofPoints = Array.isArray(proofPointsResult[0])
        ? proofPointsResult[0]
        : [proofPointsResult[0]];
    }

    // Group by proof point
    const proofPointStatsMap = new Map();

    for (const exercise of allExercises) {
      const ppId = exercise.proof_point;
      if (!proofPointStatsMap.has(ppId)) {
        const ppData = proofPoints.find((pp) => pp.id === ppId);
        proofPointStatsMap.set(ppId, {
          proofPointId: ppId,
          proofPointName: ppData?.nombre || 'Unknown',
          totalExercises: 0,
          completedExercises: 0,
          timeInvestedMinutes: 0,
          scores: [],
        });
      }

      const stats = proofPointStatsMap.get(ppId);
      stats.totalExercises++;

      const progress = progressRecords.find(
        (p) => p.exercise_instance === exercise.id && p.estado === 'completado',
      );
      if (progress) {
        stats.completedExercises++;
        stats.timeInvestedMinutes += progress.tiempo_invertido_minutos || 0;
        if (progress.score_final !== null && progress.score_final !== undefined) {
          stats.scores.push(progress.score_final);
        }
      }
    }

    // Convert to DTO format
    const proofPointStats = Array.from(proofPointStatsMap.values()).map((stats) => ({
      proofPointId: stats.proofPointId,
      proofPointName: stats.proofPointName,
      totalExercises: stats.totalExercises,
      completedExercises: stats.completedExercises,
      completionPercentage:
        stats.totalExercises > 0
          ? Math.round((stats.completedExercises / stats.totalExercises) * 100)
          : 0,
      averageScore:
        stats.scores.length > 0
          ? stats.scores.reduce((sum: number, s: number) => sum + s, 0) / stats.scores.length
          : null,
      timeInvestedMinutes: stats.timeInvestedMinutes,
    }));

    // Get recent completed exercises (last 10)
    const recentCompletedQuery = `
      SELECT
        id,
        exercise_instance,
        fecha_completado,
        score_final,
        tiempo_invertido_minutos
      FROM exercise_progress
      WHERE estudiante = type::thing($estudianteId)
        AND cohorte = type::thing($cohorteId)
        AND estado = 'completado'
      ORDER BY fecha_completado DESC
      LIMIT 10
    `;

    const recentResult = await this.db.query(recentCompletedQuery, {
      estudianteId: body.estudianteId,
      cohorteId: body.cohorteId,
    });

    let recentRecords: any[] = [];
    if (Array.isArray(recentResult) && recentResult.length > 0) {
      recentRecords = Array.isArray(recentResult[0]) ? recentResult[0] : [recentResult[0]];
    }

    const recentCompletedExercises = recentRecords.map((record) => {
      const exercise = allExercises.find((e) => e.id === record.exercise_instance);
      return {
        exerciseId: record.exercise_instance,
        exerciseName: exercise?.nombre || 'Unknown',
        exerciseTemplate: exercise?.template || 'general',
        completedAt: record.fecha_completado,
        score: record.score_final,
        timeInvestedMinutes: record.tiempo_invertido_minutos || 0,
      };
    });

    return {
      totalExercises: allExercises.length,
      completedExercises: completedRecords.length,
      inProgressExercises: inProgressRecords.length,
      completionPercentage:
        allExercises.length > 0
          ? Math.round((completedRecords.length / allExercises.length) * 100)
          : 0,
      totalTimeInvestedMinutes: totalTimeInvested,
      averageScore,
      proofPointStats,
      recentCompletedExercises,
    };
  }

  /**
   * Generate AI feedback for completed exercise
   */
  private async generateAIFeedback(
    exerciseName: string,
    exerciseType: string,
    studentWork: any,
    timeSpent: number,
  ): Promise<string> {
    try {
      const prompt = `Como tutor experto, proporciona feedback constructivo y personalizado para un estudiante que acaba de completar el ejercicio "${exerciseName}" de tipo "${exerciseType}".

El estudiante invirtió ${timeSpent} minutos y este es su trabajo:
${JSON.stringify(studentWork, null, 2)}

Proporciona feedback que:
1. Reconozca los aspectos positivos del trabajo
2. Identifique áreas específicas de mejora
3. Ofrezca sugerencias concretas y accionables
4. Sea motivador y alentador
5. Sea conciso (máximo 150 palabras)

Feedback:`;

      const response = await this.openAIService.generateCompletion(prompt, {
        maxTokens: 300,
      });

      return response.trim();
    } catch (error) {
      this.logger.error('Failed to generate AI feedback:', error);
      // Fallback to generic message
      return `¡Excelente trabajo! Has completado el ejercicio "${exerciseName}" exitosamente. Continúa practicando para fortalecer tus habilidades.`;
    }
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
