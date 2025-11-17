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
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { SurrealDbService } from "../../../core/database/surrealdb.service";
import { OpenAIService } from "../../../infrastructure/ai/OpenAIService";
import {
  StartExerciseDto,
  SaveProgressDto,
  CompleteExerciseDto,
  CompleteExerciseResponseDto,
  ExerciseProgressResponseDto,
  ExerciseProgressStatus,
  StudentProgressSummaryDto,
  ProofPointProgressResponseDto,
  ExerciseProgressSummaryDto,
  LessonAssistantRequestDto,
  LessonAssistantResponseDto,
  LessonQuestionEvaluationDto,
  LessonQuestionEvaluationResponseDto,
  LessonQuestionTypeEnum,
} from "../../dtos/exercise-progress";
import { Public } from "../../../core/decorators";

/**
 * ExerciseProgressController
 * REST API endpoints for Exercise Progress Management (Student actions)
 */
@ApiTags("exercise-progress")
@Controller()
@ApiBearerAuth("JWT-auth")
export class ExerciseProgressController {
  private readonly logger = new Logger(ExerciseProgressController.name);

  constructor(
    private readonly db: SurrealDbService,
    private readonly openAIService: OpenAIService,
  ) {}

  /**
   * Start an exercise (mark as started)
   */
  @Public()
  @Post("student/exercises/:exerciseId/start")
  @ApiOperation({
    summary: "Start an exercise",
    description: "Mark an exercise as started by a student",
  })
  @ApiParam({
    name: "exerciseId",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 201,
    description: "Exercise started successfully",
    type: ExerciseProgressResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Exercise not found or not published",
  })
  async startExercise(
    @Param("exerciseId") exerciseId: string,
    @Body() startDto: StartExerciseDto,
  ): Promise<ExerciseProgressResponseDto> {
    const decodedId = decodeURIComponent(exerciseId);

    // Verify exercise is published
    const exerciseQuery = `
      SELECT * FROM type::thing($id)
      WHERE estado_contenido = 'publicado'
    `;

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

    if (!exercise) {
      throw new NotFoundException(
        `Published exercise not found: ${exerciseId}`,
      );
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
        status: 'in_progress',
        porcentaje_completitud: 0,
        fecha_inicio: time::now(),
        submitted_at: null,
        instructor_feedback: {},
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
      throw new BadRequestException("Failed to create progress record");
    }

    return this.mapProgressToDto(newProgress);
  }

  /**
   * Save exercise progress
   */
  @Public()
  @Put("student/exercises/:exerciseId/progress")
  @ApiOperation({
    summary: "Save exercise progress",
    description: "Save current progress and student work data",
  })
  @ApiParam({
    name: "exerciseId",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Progress saved successfully",
    type: ExerciseProgressResponseDto,
  })
  async saveProgress(
    @Param("exerciseId") exerciseId: string,
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
      throw new NotFoundException(
        "Progress record not found. Start the exercise first.",
      );
    }

    const resolvedStatus = this.normalizeStatusFromRecord(progress);
    const instructorFeedback = progress.instructor_feedback ?? null;
    const submittedAt = progress.submitted_at ?? null;

    // Update progress
    const updateQuery = `
      UPDATE type::thing($progressId) SET
        status = $status,
        porcentaje_completitud = $porcentaje,
        tiempo_invertido_minutos = $tiempo,
        datos_guardados = $datos,
        instructor_feedback = $instructorFeedback,
        submitted_at = $submittedAt,
        updated_at = time::now()
      RETURN AFTER
    `;

    const updateResult = await this.db.query(updateQuery, {
      progressId: progress.id,
      status: resolvedStatus,
      porcentaje:
        saveDto.porcentajeCompletitud ?? progress.porcentaje_completitud,
      tiempo:
        saveDto.tiempoInvertidoMinutos ?? progress.tiempo_invertido_minutos,
      datos: saveDto.datos ?? progress.datos_guardados ?? {},
      instructorFeedback,
      submittedAt,
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
      throw new BadRequestException("Failed to update progress");
    }

    return this.mapProgressToDto(updatedProgress);
  }

  /**
   * Complete an exercise
   */
  @Public()
  @Post("student/exercises/:exerciseId/complete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Complete an exercise",
    description: "Mark exercise as completed and submit final work",
  })
  @ApiParam({
    name: "exerciseId",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Exercise completed successfully",
    type: CompleteExerciseResponseDto,
  })
  async completeExercise(
    @Param("exerciseId") exerciseId: string,
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
      throw new NotFoundException(
        "Progress record not found. Start the exercise first.",
      );
    }

    // Update to completed
    const updateQuery = `
      UPDATE type::thing($progressId) SET
        estado = 'completado',
        status = 'submitted_for_review',
        porcentaje_completitud = 100,
        fecha_completado = time::now(),
        submitted_at = time::now(),
        tiempo_invertido_minutos = $tiempo,
        score_final = $score,
        datos_guardados = $datos,
        instructor_feedback = $instructorFeedback,
        updated_at = time::now()
      RETURN AFTER
    `;

    const updateResult = await this.db.query(updateQuery, {
      progressId: progress.id,
      tiempo:
        completeDto.tiempoInvertidoMinutos ?? progress.tiempo_invertido_minutos,
      score: completeDto.scoreFinal ?? null,
      datos: completeDto.datos,
      instructorFeedback: progress.instructor_feedback ?? null,
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
      throw new BadRequestException("Failed to complete exercise");
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
      exercise?.nombre || "ejercicio",
      exercise?.template || "general",
      completeDto.datos,
      completeDto.tiempoInvertidoMinutos || 0,
    );

    return {
      id: completedProgress.id,
      estado: completedProgress.estado,
      status: this.normalizeStatusFromRecord(completedProgress),
      scoreFinal: completedProgress.score_final,
      submittedAt: completedProgress.submitted_at,
      feedback,
      completado: true,
    };
  }

  /**
   * Get exercise progress for a student
   */
  @Public()
  @Get("student/exercises/:exerciseId/progress")
  @ApiOperation({
    summary: "Get exercise progress",
    description: "Get current progress for a student on a specific exercise",
  })
  @ApiParam({
    name: "exerciseId",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Progress information",
    type: ExerciseProgressResponseDto,
  })
  @ApiResponse({ status: 404, description: "Progress not found" })
  async getProgress(
    @Param("exerciseId") exerciseId: string,
    @Query("estudianteId") estudianteId?: string,
    @Query("cohorteId") cohorteId?: string,
  ): Promise<ExerciseProgressResponseDto> {
    const decodedId = decodeURIComponent(exerciseId);
    const resolvedEstudianteId = estudianteId?.trim();
    const resolvedCohorteId = cohorteId?.trim();

    if (!resolvedEstudianteId || !resolvedCohorteId) {
      throw new BadRequestException(
        "Los parámetros estudianteId y cohorteId son requeridos",
      );
    }

    const query = `
      SELECT * FROM exercise_progress
      WHERE exercise_instance = type::thing($exerciseId)
        AND estudiante = type::thing($estudianteId)
        AND cohorte = type::thing($cohorteId)
      LIMIT 1
    `;

    const result = await this.db.query(query, {
      exerciseId: decodedId,
      estudianteId: resolvedEstudianteId,
      cohorteId: resolvedCohorteId,
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
      throw new NotFoundException("Progress not found");
    }

    return this.mapProgressToDto(progress);
  }

  /**
   * Get student progress summary
   */
  @Public()
  @Get("student/progress/summary")
  @ApiOperation({
    summary: "Get student progress summary",
    description:
      "Get overall progress statistics for a student across all exercises",
  })
  @ApiResponse({
    status: 200,
    description: "Progress summary",
    type: StudentProgressSummaryDto,
  })
  async getProgressSummary(
    @Query("estudianteId") estudianteId?: string,
    @Query("cohorteId") cohorteId?: string,
  ): Promise<StudentProgressSummaryDto> {
    if (!estudianteId || !cohorteId) {
      throw new BadRequestException(
        "Los parámetros estudianteId y cohorteId son requeridos",
      );
    }
    // Get all progress records for student
    const progressQuery = `
      SELECT
        id,
        exercise_instance,
        estado,
        status,
        score_final,
        tiempo_invertido_minutos,
        fecha_completado,
        submitted_at,
        instructor_feedback,
        porcentaje_completitud
      FROM exercise_progress
      WHERE estudiante = type::thing($estudianteId)
        AND cohorte = type::thing($cohorteId)
    `;

    const progressResult = await this.db.query(progressQuery, {
      estudianteId,
      cohorteId,
    });

    let progressRecords: any[] = [];
    if (Array.isArray(progressResult) && progressResult.length > 0) {
      progressRecords = Array.isArray(progressResult[0])
        ? progressResult[0]
        : [progressResult[0]];
    }

    // Get all published exercises for the cohorte
    const exercisesQuery = `
      SELECT id, nombre, template, proof_point, cohorte
      FROM exercise_instance
      WHERE estado_contenido = 'publicado'
    `;

    const exercisesResult = await this.db.query(exercisesQuery);

    let allExercises: any[] = [];
    if (Array.isArray(exercisesResult) && exercisesResult.length > 0) {
      allExercises = Array.isArray(exercisesResult[0])
        ? exercisesResult[0]
        : [exercisesResult[0]];
    }

    allExercises = allExercises.filter((exercise) =>
      this.isExerciseAvailableForCohorte(exercise, cohorteId),
    );

    // Calculate overall statistics
    const completedRecords = progressRecords.filter(
      (p) => this.normalizeStatusFromRecord(p) === "approved",
    );
    const inProgressRecords = progressRecords.filter((p) => {
      const status = this.normalizeStatusFromRecord(p);
      return status === "in_progress" || status === "requires_iteration";
    });

    const totalTimeInvested = progressRecords.reduce(
      (sum, p) => sum + (p.tiempo_invertido_minutos || 0),
      0,
    );

    const scoresWithValues = completedRecords
      .filter((p) => p.score_final !== null && p.score_final !== undefined)
      .map((p) => p.score_final);

    const averageScore =
      scoresWithValues.length > 0
        ? scoresWithValues.reduce((sum, s) => sum + s, 0) /
          scoresWithValues.length
        : null;

    // Get proof point names
    const proofPointIds = [...new Set(allExercises.map((e) => e.proof_point))];
    const proofPointsQuery = `
      SELECT id, nombre
      FROM proof_point
      WHERE id IN [${proofPointIds.map((id) => `type::thing('${id}')`).join(", ")}]
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
          proofPointName: ppData?.nombre || "Unknown",
          totalExercises: 0,
          completedExercises: 0,
          timeInvestedMinutes: 0,
          scores: [],
        });
      }

      const stats = proofPointStatsMap.get(ppId);
      stats.totalExercises++;

      const progress = progressRecords.find(
        (p) => p.exercise_instance === exercise.id,
      );
      if (
        progress &&
        this.normalizeStatusFromRecord(progress) === "approved"
      ) {
        stats.completedExercises++;
        stats.timeInvestedMinutes += progress.tiempo_invertido_minutos || 0;
        if (
          progress.score_final !== null &&
          progress.score_final !== undefined
        ) {
          stats.scores.push(progress.score_final);
        }
      }
    }

    // Convert to DTO format
    const proofPointStats = Array.from(proofPointStatsMap.values()).map(
      (stats) => ({
        proofPointId: stats.proofPointId,
        proofPointName: stats.proofPointName,
        totalExercises: stats.totalExercises,
        completedExercises: stats.completedExercises,
        completionPercentage:
          stats.totalExercises > 0
            ? Math.round(
                (stats.completedExercises / stats.totalExercises) * 100,
              )
            : 0,
        averageScore:
          stats.scores.length > 0
            ? stats.scores.reduce((sum: number, s: number) => sum + s, 0) /
              stats.scores.length
            : null,
        timeInvestedMinutes: stats.timeInvestedMinutes,
      }),
    );

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
      estudianteId,
      cohorteId,
    });

    let recentRecords: any[] = [];
    if (Array.isArray(recentResult) && recentResult.length > 0) {
      recentRecords = Array.isArray(recentResult[0])
        ? recentResult[0]
        : [recentResult[0]];
    }

    const recentCompletedExercises = recentRecords.map((record) => {
      const exercise = allExercises.find(
        (e) => e.id === record.exercise_instance,
      );
      return {
        exerciseId: record.exercise_instance,
        exerciseName: exercise?.nombre || "Unknown",
        exerciseTemplate: exercise?.template || "general",
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
   * Get proof point progress
   */
  @Public()
  @Get("student/proof-points/:proofPointId/progress")
  @ApiOperation({
    summary: "Get proof point progress",
    description: "Get detailed progress for a specific proof point",
  })
  @ApiParam({
    name: "proofPointId",
    description: "ProofPoint ID",
    example: "proof_point:⟨1762784185921_0⟩",
  })
  @ApiResponse({
    status: 200,
    description: "Proof point progress",
    type: ProofPointProgressResponseDto,
  })
  async getProofPointProgress(
    @Param("proofPointId") proofPointId: string,
    @Query("estudianteId") estudianteId?: string,
    @Query("cohorteId") cohorteId?: string,
  ): Promise<ProofPointProgressResponseDto> {
    const decodedProofPointId = decodeURIComponent(proofPointId);

    if (!estudianteId || !cohorteId) {
      throw new BadRequestException(
        "Los parámetros estudianteId y cohorteId son requeridos",
      );
    }

    // Get all exercises for this proof point
    const exercisesQuery = `
      SELECT id, nombre, template, orden, es_obligatorio, cohorte
      FROM exercise_instance
      WHERE proof_point = type::thing($proofPointId)
        AND estado_contenido = 'publicado'
      ORDER BY orden ASC
    `;

    const exercisesResult = await this.db.query(exercisesQuery, {
      proofPointId: decodedProofPointId,
    });

    let exercises: any[] = [];
    if (Array.isArray(exercisesResult) && exercisesResult.length > 0) {
      exercises = Array.isArray(exercisesResult[0])
        ? exercisesResult[0]
        : [exercisesResult[0]];
    }

    exercises = exercises.filter((exercise) =>
      this.isExerciseAvailableForCohorte(exercise, cohorteId),
    );

    if (exercises.length === 0) {
      return {
        proofPointId: decodedProofPointId,
        studentId: estudianteId,
        status: "locked",
        progress: 0,
        completedExercises: 0,
        totalExercises: 0,
        requiredExercises: 0,
        averageScore: 0,
        exercises: [],
      };
    }

    // Get all progress records for the student and cohort, then filter by proof point exercises
    const progressQuery = `
      SELECT
        id,
        exercise_instance,
        estado,
        status,
        porcentaje_completitud,
        score_final,
        fecha_inicio,
        fecha_completado,
        submitted_at,
        instructor_feedback,
        fecha_ultimo_acceso
      FROM exercise_progress
      WHERE estudiante = type::thing($estudianteId)
        AND cohorte = type::thing($cohorteId)
    `;

    const progressResult = await this.db.query(progressQuery, {
      estudianteId,
      cohorteId,
    });

    let allProgressRecords: any[] = [];
    if (Array.isArray(progressResult) && progressResult.length > 0) {
      allProgressRecords = Array.isArray(progressResult[0])
        ? progressResult[0]
        : [progressResult[0]];
    }

    const exerciseIds = new Set(exercises.map((exercise) => exercise.id));
    const progressRecords = allProgressRecords.filter((record) =>
      exerciseIds.has(record.exercise_instance),
    );

    // Calculate exercise summaries
    const exerciseSummaries: ExerciseProgressSummaryDto[] = exercises.map(
      (exercise) => {
        const progress = progressRecords.find(
          (p) => p.exercise_instance === exercise.id,
        );

        let status: ExerciseProgressStatus = "not_started";
        let progressPercentage = 0;
        let score: number | undefined = undefined;
        let lastAccessed: Date | undefined = undefined;

        if (progress) {
          status = this.normalizeStatusFromRecord(progress);
          const storedProgress = progress.porcentaje_completitud || 0;

          if (status === "approved") {
            progressPercentage = 100;
          } else if (status === "submitted_for_review") {
            progressPercentage = storedProgress > 0 ? storedProgress : 100;
          } else {
            progressPercentage = storedProgress;
          }
          score = progress.score_final;
          lastAccessed = progress.fecha_ultimo_acceso;
        }

        return {
          exerciseId: exercise.id,
          status,
          progress: progressPercentage,
          score,
          lastAccessed,
        };
      },
    );

    // Calculate overall statistics
    const completedExercises = exerciseSummaries.filter(
      (e) => e.status === "approved",
    ).length;
    const totalExercises = exercises.length;
    const progressPercentage =
      totalExercises > 0
        ? Math.round(
            exerciseSummaries.reduce(
              (sum, summary) => sum + (summary.progress || 0),
              0,
            ) / totalExercises,
          )
        : 0;

    // Calculate average score
    const scoresWithValues = exerciseSummaries
      .filter((e) => e.score !== null && e.score !== undefined)
      .map((e) => e.score!);

    const averageScore =
      scoresWithValues.length > 0
        ? scoresWithValues.reduce((sum, s) => sum + s, 0) /
          scoresWithValues.length
        : 0;

    // Determine status
    let status: "locked" | "available" | "in_progress" | "completed" =
      totalExercises === 0 ? "locked" : "available";
    if (completedExercises === totalExercises && totalExercises > 0) {
      status = "completed";
    } else if (exerciseSummaries.some((e) => e.status !== "not_started")) {
      status = "in_progress";
    }

    // Find earliest start date and latest completion date
    const completedProgressRecords = progressRecords.filter(
      (p) => this.normalizeStatusFromRecord(p) === "approved",
    );
    const startedAtRaw = progressRecords
      .map((p) => p.fecha_inicio)
      .filter(Boolean)
      .reduce<string | undefined>((earliest, fecha) => {
        if (!earliest || fecha < earliest) {
          return fecha;
        }
        return earliest;
      }, undefined);

    const completedAtRaw =
      completedProgressRecords.length > 0
        ? completedProgressRecords
            .map((p) => p.fecha_completado)
            .filter(Boolean)
            .reduce<string | undefined>((latest, fecha) => {
              if (!latest || fecha > latest) {
                return fecha;
              }
              return latest;
            }, undefined)
        : undefined;

    const startedAt = startedAtRaw ? new Date(startedAtRaw) : undefined;
    const completedAt = completedAtRaw ? new Date(completedAtRaw) : undefined;

    const requiredExercises = exercises.filter(
      (exercise) => exercise.es_obligatorio !== false,
    ).length;

    return {
      proofPointId: decodedProofPointId,
      studentId: estudianteId,
      status,
      progress: progressPercentage,
      completedExercises,
      totalExercises,
      requiredExercises,
      averageScore,
      startedAt,
      completedAt,
      exercises: exerciseSummaries,
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
      this.logger.error("Failed to generate AI feedback:", error);
      // Fallback to generic message
      return `¡Excelente trabajo! Has completado el ejercicio "${exerciseName}" exitosamente. Continúa practicando para fortalecer tus habilidades.`;
    }
  }

  /**
   * Contextual lesson assistant chat endpoint
   */
  @Public()
  @Post("student/exercises/:exerciseId/assistant/chat")
  @ApiOperation({
    summary: "Enviar pregunta al asistente contextual de la lección",
    description:
      "El asistente recibe el contenido de la sección actual, historial recortado y perfil de comprensión para responder en tono socrático.",
  })
  async sendLessonAssistantMessage(
    @Param("exerciseId") exerciseId: string,
    @Body() assistantDto: LessonAssistantRequestDto,
  ): Promise<LessonAssistantResponseDto> {
    const limitedHistory =
      assistantDto.historial?.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      })) ?? [];

    const profileSummary = assistantDto.perfilComprension
      ? JSON.stringify(assistantDto.perfilComprension, null, 2)
      : "No hay datos de progreso previos.";

    const defaultSystemPrompt = `Eres el asistente pedagógico de Xpertia que acompaña a estudiantes dentro de una lección interactiva.
Actúa como tutor socrático amable:
- Siempre valida si la duda ya se resolvió en la sección actual antes de introducir información nueva.
- Si el estudiante pregunta algo explicado en una sección previa que no ha leído, sugiérele regresar antes de responder en profundidad.
- Responde en español, usando formato markdown y citando conceptos relevantes entre comillas cuando apliquen.
- Formula preguntas guía que impulsen reflexión y conexión con el contenido.
- Ajusta el nivel de profundidad según el historial y el perfil de comprensión compartido.
- Termina cada respuesta con una línea "Referencias: <lista separada por ';'>" mencionando los encabezados concretos usados (al menos la sección actual).`;

    const systemPrompt =
      assistantDto.systemPromptOverride?.trim().length
        ? assistantDto.systemPromptOverride
        : defaultSystemPrompt;

    const userContent = `SECCIÓN ACTUAL (${assistantDto.seccionTitulo} · ${assistantDto.seccionId})
${assistantDto.seccionContenido}

PERFIL DE COMPRENSIÓN
${profileSummary}

PREGUNTA DEL ESTUDIANTE
${assistantDto.pregunta}

CONCEPTO FOCAL
${assistantDto.conceptoFocal ?? "No especificado"}

Recuerda citar explícitamente las secciones que utilices y mantener el tono socrático.`;

    const { content, raw } = await this.openAIService.generateChatResponse({
      systemPrompt,
      messages: [...limitedHistory, { role: "user", content: userContent }],
      maxTokens: 7500,
    });

    const { references, answer: extractedAnswer } =
      this.extractAssistantAnswer(content);
    let answer = extractedAnswer;

    if (!answer) {
      answer = this.buildAssistantFallback(assistantDto);
    }

    return {
      respuesta: answer,
      referencias:
        references.length > 0
          ? references
          : [assistantDto.seccionTitulo].filter(Boolean),
      tokensUsados: raw.usage?.total_tokens,
    };
  }

  /**
   * Evaluate short-answer questions with LLM when local grading is insufficient
   */
  @Public()
  @Post("student/exercises/:exerciseId/questions/evaluate")
  @ApiOperation({
    summary: "Evaluar respuesta corta mediante IA",
    description:
      "Evalúa las preguntas de respuesta corta de la lección utilizando el contexto completo de la sección y criterios generados.",
  })
  async evaluateLessonQuestion(
    @Param("exerciseId") exerciseId: string,
    @Body() evaluationDto: LessonQuestionEvaluationDto,
  ): Promise<LessonQuestionEvaluationResponseDto> {
    if (evaluationDto.tipoPregunta !== LessonQuestionTypeEnum.RespuestaCorta) {
      throw new BadRequestException(
        "Solo se pueden evaluar con IA las preguntas de respuesta corta.",
      );
    }

    const systemPrompt = `Eres un evaluador pedagógico preciso.
- Revisa la pregunta, los criterios y la respuesta del estudiante.
- Tu salida DEBE ser JSON con la forma: {"score":"correcto|parcialmente_correcto|incorrecto","feedback":"...","sugerencias":["..."]}.
- El feedback debe citar evidencia textual (entre comillas) tomada de la respuesta del estudiante.
- Las sugerencias deben ser accionables y referir a conceptos de la sección proporcionada.`;

    const userContent = `PREGUNTA: ${evaluationDto.enunciado}
CRITERIOS: ${JSON.stringify(evaluationDto.criteriosEvaluacion, null, 2)}
SECCIÓN (${evaluationDto.seccionTitulo ?? "sin título"}):
${evaluationDto.seccionContenido}
PERFIL: ${JSON.stringify(evaluationDto.perfilComprension ?? {}, null, 2)}
RESPUESTA DEL ESTUDIANTE:
${evaluationDto.respuestaEstudiante}`;

    const { content } = await this.openAIService.generateChatResponse({
      systemPrompt,
      messages: [{ role: "user", content: userContent }],
      maxTokens: 500,
      responseFormat: { type: "json_object" },
    });

    let parsed: any = {};
    try {
      parsed = content ? JSON.parse(content) : {};
    } catch (error) {
      this.logger.error(
        "No se pudo parsear la respuesta de evaluación de IA",
        error,
      );
    }

    const normalizedScore = this.normalizeEvaluationScore(parsed.score);

    return {
      preguntaId: evaluationDto.preguntaId,
      score: normalizedScore,
      feedback:
        parsed.feedback ||
        "No pude evaluar automáticamente. Intenta reformular tu respuesta o contacta a tu instructor.",
      sugerencias: parsed.sugerencias ?? [],
    };
  }

  private extractAssistantAnswer(rawContent: string): {
    answer: string;
    references: string[];
  } {
    if (!rawContent) {
      return { answer: "", references: [] };
    }

    const lines = rawContent.trim().split("\n");
    let references: string[] = [];
    while (lines.length > 0) {
      const lastLine = lines[lines.length - 1].trim();
      if (lastLine.length === 0) {
        lines.pop();
        continue;
      }

      if (/^referencias:/i.test(lastLine)) {
        const refText = lastLine.replace(/^referencias:/i, "").trim();
        references = refText
          .split(/[,;]+/g)
          .map((ref) => ref.trim())
          .filter((ref) => ref.length > 0);
        lines.pop();
      }
      break;
    }

    return {
      answer: lines.join("\n").trim(),
      references,
    };
  }

  private buildAssistantFallback(
    assistantDto: LessonAssistantRequestDto,
  ): string {
    const sectionTitle = assistantDto.seccionTitulo || "esta sección";
    const sectionContent = assistantDto.seccionContenido || "";
    const summary = sectionContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .slice(0, 2)
      .join(" ");

    const focus = assistantDto.conceptoFocal ?? "la idea principal";

    return `No pude consultar al mentor IA en este momento, pero aquí tienes un recordatorio rápido sobre "${sectionTitle}": ${
      summary || "repasa la sección para retomar el hilo"
    }.\n\nVuelve a intentarlo formulando tu duda sobre ${focus} o dime qué parte quieres profundizar.`;
  }

  private normalizeEvaluationScore(
    rawScore: string,
  ): "correcto" | "parcialmente_correcto" | "incorrecto" {
    const value = (rawScore || "").toLowerCase();
    if (value.includes("parcial")) {
      return "parcialmente_correcto";
    }
    if (value.includes("incorre") || value.includes("mal")) {
      return "incorrecto";
    }
    return "correcto";
  }

  private isExerciseAvailableForCohorte(
    exercise: any,
    cohorteId: string,
  ): boolean {
    const exerciseCohorteId = this.extractRecordId(exercise?.cohorte);
    if (!exerciseCohorteId) {
      return true;
    }
    return exerciseCohorteId === cohorteId;
  }

  private extractRecordId(value: any): string | null {
    if (!value) {
      return null;
    }

    if (typeof value === "string") {
      return value;
    }

    if (typeof value === "object") {
      if (typeof value.id === "string") {
        return value.id;
      }
      if (typeof value["@id"] === "string") {
        return value["@id"];
      }
      if (typeof value.toString === "function") {
        const stringValue = value.toString();
        if (typeof stringValue === "string" && stringValue.length > 0) {
          return stringValue;
        }
      }
    }

    return null;
  }

  private normalizeStatusFromRecord(
    progress: any,
  ): ExerciseProgressStatus {
    const mappedStatus = this.mapStatus(progress?.status);
    if (mappedStatus) {
      return mappedStatus;
    }
    return this.mapEstadoToStatus(progress?.estado);
  }

  private mapStatus(
    status?: string | null,
  ): ExerciseProgressStatus | null {
    switch (status) {
      case "not_started":
      case "in_progress":
      case "submitted_for_review":
      case "requires_iteration":
      case "approved":
        return status;
      default:
        return null;
    }
  }

  private mapEstadoToStatus(
    estado?: string | null,
  ): ExerciseProgressStatus {
    switch (estado) {
      case "no_iniciado":
        return "not_started";
      case "en_progreso":
        return "in_progress";
      case "pendiente_revision":
        return "submitted_for_review";
      case "revision_requerida":
        return "requires_iteration";
      case "completado":
        return "approved";
      default:
        return "not_started";
    }
  }

  /**
   * Helper to map database record to DTO
   */
  private mapProgressToDto(progress: any): ExerciseProgressResponseDto {
    const status = this.normalizeStatusFromRecord(progress);

    return {
      id: progress.id,
      exerciseInstance: progress.exercise_instance,
      estudiante: progress.estudiante,
      cohorte: progress.cohorte,
      estado: progress.estado,
      status,
      porcentajeCompletitud: progress.porcentaje_completitud,
      fechaInicio: progress.fecha_inicio,
      fechaCompletado: progress.fecha_completado,
      submittedAt: progress.submitted_at,
      tiempoInvertidoMinutos: progress.tiempo_invertido_minutos,
      numeroIntentos: progress.numero_intentos,
      scoreFinal: progress.score_final,
      instructorFeedback: progress.instructor_feedback,
      datosGuardados: progress.datos_guardados,
      createdAt: progress.created_at,
      updatedAt: progress.updated_at,
    };
  }
}
