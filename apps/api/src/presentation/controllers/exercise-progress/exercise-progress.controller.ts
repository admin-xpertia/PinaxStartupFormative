import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Logger,
  Query,
  Res,
  UseGuards,
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
import { ShadowMonitorService } from "../../../application/exercise-instance/services/ShadowMonitorService";
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
import {
  Public,
  Roles,
  User,
} from "../../../core/decorators";
import { SubmitExerciseForGradingUseCase } from "../../../application/exercise-progress/use-cases/SubmitExerciseForGrading/SubmitExerciseForGradingUseCase";
import { ReviewAndGradeSubmissionUseCase } from "../../../application/exercise-progress/use-cases/ReviewAndGradeSubmission/ReviewAndGradeSubmissionUseCase";
import {
  ReviewAndGradeSubmissionDto,
  SubmitExerciseForGradingDto,
  SubmitExerciseForGradingResponseDto,
  ReviewAndGradeSubmissionResponseDto,
  InstructorSubmissionListItemDto,
  CohortProgressOverviewResponseDto,
  CohortProgressOverviewRecordDto,
} from "../../dtos/exercise-progress/submit-exercise.dto";
import { RolesGuard } from "../../../core/guards/roles.guard";

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
    private readonly shadowMonitor: ShadowMonitorService,
    private readonly submitExerciseForGrading: SubmitExerciseForGradingUseCase,
    private readonly reviewAndGradeSubmission: ReviewAndGradeSubmissionUseCase,
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
    @Query("estudianteId") estudianteIdQuery?: string,
    @Query("cohorteId") cohorteIdQuery?: string,
  ): Promise<ExerciseProgressResponseDto> {
    try {
      // Handle double URL encoding
      let decodedId = decodeURIComponent(exerciseId);
      // Check if still encoded (contains %)
      if (decodedId.includes('%')) {
        decodedId = decodeURIComponent(decodedId);
      }
      this.logger.debug(`[startExercise] Original: ${exerciseId}, Decoded: ${decodedId}`);

      const { estudianteId, cohorteId } = await this.resolveStudentContext({
        bodyEstudianteId: startDto.estudianteId,
        bodyCohorteId: startDto.cohorteId,
        queryEstudianteId: estudianteIdQuery,
        queryCohorteId: cohorteIdQuery,
      });

      await this.getPublishedExerciseOrThrow(decodedId);

      const existingProgress = await this.findProgressRecord(
        decodedId,
        estudianteId,
        cohorteId,
      );

      // If progress exists, return it
      if (existingProgress) {
        return this.mapProgressToDto(existingProgress);
      }

      const newProgress = await this.createProgressRecord({
        exerciseId: decodedId,
        estudianteId,
        cohorteId,
        estado: "en_progreso",
        status: "in_progress",
        porcentajeCompletitud: 0,
        tiempoInvertidoMinutos: 0,
        datosGuardados: {},
      });

      if (!newProgress) {
        throw new BadRequestException("Failed to create progress record");
      }

      return this.mapProgressToDto(newProgress);
    } catch (error) {
      this.logger.error(`[startExercise] Error: ${error.message}`, error.stack);
      throw error;
    }
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
    @Query("estudianteId") estudianteIdQuery?: string,
    @Query("cohorteId") cohorteIdQuery?: string,
  ): Promise<ExerciseProgressResponseDto> {
    this.logger.debug(`[DEBUG] saveProgress - Received DTO: ${JSON.stringify(saveDto)}`);
    this.logger.debug(`[DEBUG] saveProgress - datos field: ${JSON.stringify(saveDto.datos)}`);

    const decodedId = this.decodeExerciseId(exerciseId);
    const { estudianteId, cohorteId } = await this.resolveStudentContext({
      bodyEstudianteId: saveDto.estudianteId,
      bodyCohorteId: saveDto.cohorteId,
      queryEstudianteId: estudianteIdQuery,
      queryCohorteId: cohorteIdQuery,
    });

    let progress = await this.findProgressRecord(
      decodedId,
      estudianteId,
      cohorteId,
    );

    const normalizedDatos = this.normalizeDatosForStorage(
      saveDto.datos ?? progress?.datos_guardados ?? progress?.datos,
      progress?.datos_guardados ?? progress?.datos ?? {},
    );

    if (!progress) {
      await this.getPublishedExerciseOrThrow(decodedId);
      progress = await this.createProgressRecord({
        exerciseId: decodedId,
        estudianteId,
        cohorteId,
        estado: "en_progreso",
        status: "in_progress",
        porcentajeCompletitud: saveDto.porcentajeCompletitud ?? 0,
        tiempoInvertidoMinutos: saveDto.tiempoInvertidoMinutos ?? 0,
        datosGuardados: normalizedDatos,
      });
    }

    if (!progress) {
      throw new BadRequestException(
        "No se pudo crear o recuperar el progreso del ejercicio",
      );
    }

    const resolvedStatus = this.normalizeStatusFromRecord(progress);
    if (this.isSubmissionLockedStatus(resolvedStatus)) {
      throw new BadRequestException(
        "Esta entrega ya fue enviada o calificada y solo puede visualizarse.",
      );
    }
    const instructorFeedback = progress.instructor_feedback ?? null;

    // Update progress
    const updateQuery = `
      UPDATE type::thing($progressId) SET
        status = $status,
        porcentaje_completitud = $porcentaje,
        tiempo_invertido_minutos = $tiempo,
        datos_guardados = $datos,
        datos = $datos,
        instructor_feedback = $instructorFeedback,
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
      datos: normalizedDatos,
      instructorFeedback,
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
  @Post("student/exercises/:exerciseId/submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Enviar ejercicio para calificación automática",
    description:
      "Guarda el trabajo final, solicita evaluación IA (0-100) y deja la entrega en pendiente de revisión.",
  })
  @ApiParam({
    name: "exerciseId",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Entrega enviada correctamente",
    type: SubmitExerciseForGradingResponseDto,
  })
  async submitForGrading(
    @Param("exerciseId") exerciseId: string,
    @Body() submitDto: SubmitExerciseForGradingDto,
    @Query("estudianteId") estudianteIdQuery?: string,
    @Query("cohorteId") cohorteIdQuery?: string,
  ): Promise<SubmitExerciseForGradingResponseDto> {
    const decodedId = this.decodeExerciseId(exerciseId);
    const { estudianteId, cohorteId } = await this.resolveStudentContext({
      bodyEstudianteId: submitDto.estudianteId,
      bodyCohorteId: submitDto.cohorteId,
      queryEstudianteId: estudianteIdQuery,
      queryCohorteId: cohorteIdQuery,
    });

    const result = await this.submitExerciseForGrading.execute({
      exerciseInstanceId: decodedId,
      estudianteId,
      cohorteId,
      datos: submitDto.datos,
      tiempoInvertidoMinutos: submitDto.tiempoInvertidoMinutos,
    });

    if (result.isFail()) {
      throw new BadRequestException(result.getError());
    }

    const value = result.getValue();
    return {
      ...value,
      status: this.normalizeStatusFromString(value.status),
    };
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
    @Query("estudianteId") estudianteIdQuery?: string,
    @Query("cohorteId") cohorteIdQuery?: string,
  ): Promise<CompleteExerciseResponseDto> {
    const decodedId = this.decodeExerciseId(exerciseId);
    const { estudianteId, cohorteId } = await this.resolveStudentContext({
      bodyEstudianteId: completeDto.estudianteId,
      bodyCohorteId: completeDto.cohorteId,
      queryEstudianteId: estudianteIdQuery,
      queryCohorteId: cohorteIdQuery,
    });

    if (completeDto.datos === undefined || completeDto.datos === null) {
      throw new BadRequestException(
        "Los datos del ejercicio son requeridos para completar.",
      );
    }

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
      estudianteId,
      cohorteId,
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
        status = 'pending_review',
        porcentaje_completitud = 100,
        fecha_completado = time::now(),
        submitted_at = time::now(),
        tiempo_invertido_minutos = $tiempo,
        score_final = $score,
        final_score = $score,
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
   * Review and grade a submission (instructor)
   */
  @Patch("instructor/submissions/:submissionId/grade")
  @UseGuards(RolesGuard)
  @Roles("instructor")
  @ApiOperation({
    summary: "Calificar una entrega",
    description:
      "Permite a instructores registrar su calificación y feedback sobre una entrega ya evaluada por IA.",
  })
  @ApiParam({
    name: "submissionId",
    description: "ID del registro de progreso a calificar",
    example: "exercise_progress:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Entrega calificada",
    type: ReviewAndGradeSubmissionResponseDto,
  })
  async gradeSubmission(
    @Param("submissionId") submissionId: string,
    @Body() gradeDto: ReviewAndGradeSubmissionDto,
    @User() user?: any,
  ): Promise<ReviewAndGradeSubmissionResponseDto> {
    const decodedId = this.decodeExerciseId(submissionId);

    const result = await this.reviewAndGradeSubmission.execute({
      submissionId: decodedId,
      instructorId: user?.id,
      instructorScore: gradeDto.instructorScore,
      instructorFeedback: gradeDto.instructorFeedback,
      publish: gradeDto.publish,
    });

    if (result.isFail()) {
      const error = result.getError();
      if (error.message.includes("No se encontró")) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }

    const value = result.getValue();
    return {
      ...value,
      status: this.normalizeStatusFromString(value.status),
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
    const decodedId = this.decodeExerciseId(exerciseId);
    const { estudianteId: resolvedEstudianteId, cohorteId: resolvedCohorteId } =
      await this.resolveStudentContext({
        queryEstudianteId: estudianteId,
        queryCohorteId: cohorteId,
      });

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
   * Get submission detail for instructors
   */
  @Get("instructor/submissions/:submissionId")
  @UseGuards(RolesGuard)
  @Roles("instructor")
  @ApiOperation({
    summary: "Obtener una entrega por ID",
    description: "Detalle completo de una entrega para revisión del instructor",
  })
  @ApiParam({
    name: "submissionId",
    description: "ID del registro exercise_progress",
    example: "exercise_progress:abc123",
  })
  async getSubmissionDetail(
    @Param("submissionId") submissionId: string,
  ): Promise<ExerciseProgressResponseDto> {
    const decodedId = decodeURIComponent(submissionId);
    const result = await this.db.query(
      `
      SELECT * FROM type::thing($id)
    `,
      { id: decodedId },
    );

    const progress = this.extractFirstRecord(result);

    if (!progress) {
      throw new NotFoundException("Entrega no encontrada");
    }

    return this.mapProgressToDto(progress);
  }

  /**
   * List pending submissions for a cohort (instructor view)
   */
  @Get("instructor/cohortes/:cohorteId/submissions")
  @UseGuards(RolesGuard)
  @Roles("instructor")
  @ApiOperation({
    summary: "Listar entregas pendientes de una cohorte",
    description:
      "Devuelve las entregas que esperan revisión humana junto con la sugerencia generada por IA.",
  })
  @ApiParam({
    name: "cohorteId",
    description: "ID de la cohorte a consultar",
    example: "cohorte:⟨1763575780115_0⟩",
  })
  @ApiResponse({
    status: 200,
    type: [InstructorSubmissionListItemDto],
  })
  async listCohortSubmissions(
    @Param("cohorteId") cohorteId: string,
    @Query("limit") limitParam?: string,
  ): Promise<InstructorSubmissionListItemDto[]> {
    const decodedCohorteId = this.decodeExerciseId(cohorteId);
    const limit = this.resolveListLimit(limitParam);
    const fetchLimit = Math.min(limit * 2, 100);
    const pendingStatuses = new Set<ExerciseProgressStatus>([
      "pending_review",
      "submitted_for_review",
    ]);

    // FIX: Primero obtenemos el programa del cohorte para buscar por ejercicios también
    const cohortProgramQuery = `
      SELECT programa FROM type::thing($cohorteId)
    `;
    const cohortProgramResult = await this.db.query(cohortProgramQuery, {
      cohorteId: decodedCohorteId,
    });
    const cohortRecord = this.extractFirstRecord(cohortProgramResult);
    const programId =
      typeof cohortRecord?.programa === "string"
        ? cohortRecord.programa
        : typeof cohortRecord?.programa?.id === "string"
          ? cohortRecord.programa.id
          : null;

    this.logger.log(
      `[Submissions Debug] Cohort program: ${programId}`,
    );

    // FIX: Buscar submissions por cohorte O por ejercicios del programa (más robusto)
    const submissionsQuery = programId
      ? `
      SELECT
        id,
        estudiante,
        exercise_instance,
        status,
        estado,
        submitted_at,
        fecha_completado,
        updated_at,
        ai_score,
        final_score,
        score_final
      FROM exercise_progress
      WHERE (
          cohorte = type::thing($cohorteId)
          OR exercise_instance.proof_point.fase.programa = type::thing($programId)
        )
        AND (
          status INSIDE ['pending_review', 'submitted_for_review']
          OR estado = 'pendiente_revision'
        )
      ORDER BY submitted_at ASC, updated_at ASC
      LIMIT ${fetchLimit}
    `
      : `
      SELECT
        id,
        estudiante,
        exercise_instance,
        status,
        estado,
        submitted_at,
        fecha_completado,
        updated_at,
        ai_score,
        final_score,
        score_final
      FROM exercise_progress
      WHERE cohorte = type::thing($cohorteId)
        AND (
          status INSIDE ['pending_review', 'submitted_for_review']
          OR estado = 'pendiente_revision'
        )
      ORDER BY submitted_at ASC, updated_at ASC
      LIMIT ${fetchLimit}
    `;

    const submissionsResult = await this.db.query(submissionsQuery, {
      cohorteId: decodedCohorteId,
      programId: programId,
    });

    // FIX: Debug logging para identificar problemas con submissions vacías
    this.logger.log(
      `[Submissions Debug] Query executed for cohort: ${decodedCohorteId}`,
    );
    this.logger.log(
      `[Submissions Debug] Raw result: ${JSON.stringify(submissionsResult)}`,
    );

    let progressRecords: any[] = [];
    if (Array.isArray(submissionsResult) && submissionsResult.length > 0) {
      progressRecords = Array.isArray(submissionsResult[0])
        ? submissionsResult[0]
        : Array.isArray(submissionsResult)
          ? submissionsResult
          : [];
    }

    this.logger.log(
      `[Submissions Debug] Progress records extracted: ${progressRecords.length}`,
    );
    this.logger.log(
      `[Submissions Debug] Records details: ${JSON.stringify(
        progressRecords.map((r) => ({
          id: r.id,
          cohorte: r.cohorte,
          status: r.status,
          estado: r.estado,
          estudiante: r.estudiante,
        })),
      )}`,
    );

    if (!progressRecords.length) {
      this.logger.warn(
        `[Submissions Debug] No progress records found for cohort ${decodedCohorteId}`,
      );
      return [];
    }

    const filtered = progressRecords
      .map((record) => ({
        record,
        status: this.normalizeStatusFromRecord(record),
      }))
      .filter(({ status }) => pendingStatuses.has(status))
      .slice(0, limit);

    this.logger.log(
      `[Submissions Debug] Filtered records: ${filtered.length}`,
    );
    this.logger.log(
      `[Submissions Debug] Filtered details: ${JSON.stringify(
        filtered.map((f) => ({
          id: f.record.id,
          status: f.status,
          originalStatus: f.record.status,
          originalEstado: f.record.estado,
        })),
      )}`,
    );

    if (!filtered.length) {
      this.logger.warn(
        `[Submissions Debug] No submissions after filtering. All statuses: ${JSON.stringify(
          progressRecords.map((r) => ({
            id: r.id,
            status: r.status,
            estado: r.estado,
            normalizedStatus: this.normalizeStatusFromRecord(r),
          })),
        )}`,
      );
      return [];
    }

    const studentIds = Array.from(
      new Set(
        filtered
          .map(({ record }) => this.extractRecordId(record.estudiante))
          .filter((id): id is string => Boolean(id)),
      ),
    );
    const exerciseIds = Array.from(
      new Set(
        filtered
          .map(({ record }) => this.extractRecordId(record.exercise_instance))
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const studentNameMap = await this.fetchStudentNames(studentIds);
    const exerciseNameMap = await this.fetchExerciseNames(exerciseIds);

    return filtered.map(({ record, status }) => {
      const studentId = this.extractRecordId(record.estudiante);
      const exerciseId = this.extractRecordId(record.exercise_instance);
      const entregadoEl =
        record.submitted_at ||
        record.fecha_completado ||
        record.updated_at ||
        new Date().toISOString();

      const aiScore =
        typeof record.ai_score === "number"
          ? Math.round(record.ai_score)
          : null;

      return {
        progressId: record.id,
        estudianteNombre:
          (studentId ? studentNameMap.get(studentId) : undefined) ||
          "Estudiante",
        ejercicioNombre:
          (exerciseId ? exerciseNameMap.get(exerciseId) : undefined) ||
          "Ejercicio",
        entregadoEl,
        status,
        aiScore,
      };
    });
  }

  /**
   * Get full cohort progress overview for instructor analytics
   */
  @Get("instructor/cohortes/:cohorteId/progress-overview")
  @UseGuards(RolesGuard)
  @Roles("instructor")
  @ApiOperation({
    summary: "Obtener todas las entregas de una cohorte",
    description:
      "Devuelve todas las entregas registradas (independientemente del estado) para construir analíticos del programa.",
  })
  @ApiParam({
    name: "cohorteId",
    description: "ID de la cohorte a consultar",
    example: "cohorte:⟨1763575780115_0⟩",
  })
  @ApiResponse({
    status: 200,
    type: CohortProgressOverviewResponseDto,
  })
  async getCohortProgressOverview(
    @Param("cohorteId") cohorteId: string,
  ): Promise<CohortProgressOverviewResponseDto> {
    const decodedCohorteId = this.decodeExerciseId(cohorteId);

    const query = `
      SELECT
        id,
        estudiante,
        exercise_instance,
        status,
        estado,
        porcentaje_completitud,
        final_score,
        score_final,
        ai_score,
        instructor_score,
        manual_feedback,
        instructor_feedback,
        feedback_json,
        feedback_data,
        submitted_at,
        graded_at,
        updated_at,
        fecha_completado,
        tiempo_invertido_minutos
      FROM exercise_progress
      WHERE cohorte = type::thing($cohorteId)
    `;

    const result = await this.db.query(query, {
      cohorteId: decodedCohorteId,
    });

    const records = Array.isArray(result?.[0])
      ? result[0]
      : Array.isArray(result)
        ? result
        : [];

    if (!records.length) {
      return {
        cohorteId: decodedCohorteId,
        submissions: [],
      };
    }

    const studentIds = Array.from(
      new Set(
        records
          .map((record) => this.extractRecordId(record.estudiante))
          .filter((value): value is string => Boolean(value)),
      ),
    );

    const studentNames = await this.fetchStudentNames(studentIds);
    const submissions = records.map((record) =>
      this.mapCohortProgressRecord(record, studentNames),
    );

    return {
      cohorteId: decodedCohorteId,
      submissions,
    };
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
    const {
      estudianteId: resolvedEstudianteId,
      cohorteId: resolvedCohorteId,
    } = await this.resolveStudentContext({
      queryEstudianteId: estudianteId,
      queryCohorteId: cohorteId,
    });
    // Get all progress records for student
    const progressQuery = `
      SELECT
        id,
        exercise_instance,
        estado,
        status,
        score_final,
        final_score,
        ai_score,
        instructor_score,
        manual_feedback,
        feedback_json,
        feedback_data,
        tiempo_invertido_minutos,
        fecha_completado,
        submitted_at,
        graded_at,
        instructor_feedback,
        porcentaje_completitud
      FROM exercise_progress
      WHERE estudiante = type::thing($estudianteId)
        AND cohorte = type::thing($cohorteId)
    `;

    const progressResult = await this.db.query(progressQuery, {
      estudianteId: resolvedEstudianteId,
      cohorteId: resolvedCohorteId,
    });

    let progressRecords: any[] = [];
    if (Array.isArray(progressResult) && progressResult.length > 0) {
      progressRecords = Array.isArray(progressResult[0])
        ? progressResult[0]
        : [progressResult[0]];
    }

    let allExercises: any[] = [];
    let proofPoints: any[] = [];

    const cohortProgramQuery = `
      SELECT programa FROM type::thing($cohorteId)
    `;
    const cohortProgramResult = await this.db.query(cohortProgramQuery, {
      cohorteId: resolvedCohorteId,
    });
    const cohortRecord = this.extractFirstRecord(cohortProgramResult);
    const programId =
      typeof cohortRecord?.programa === "string"
        ? cohortRecord.programa
        : typeof cohortRecord?.programa?.id === "string"
          ? cohortRecord.programa.id
          : null;

    if (programId) {
      const proofPointsResult = await this.db.query(
        `
          SELECT id, nombre
          FROM proof_point
          WHERE fase.programa = type::thing($programaId)
        `,
        { programaId: programId },
      );
      proofPoints = Array.isArray(proofPointsResult?.[0])
        ? proofPointsResult[0]
        : Array.isArray(proofPointsResult)
          ? proofPointsResult
          : [];

      const proofPointIdsFromProgram = proofPoints
        .map((pp: any) => (typeof pp.id === "string" ? pp.id : null))
        .filter((value): value is string => Boolean(value));

      if (proofPointIdsFromProgram.length > 0) {
        const exercisesQuery = `
          SELECT id, nombre, template, proof_point, cohorte
          FROM exercise_instance
          WHERE estado_contenido = 'publicado'
            AND proof_point IN [${proofPointIdsFromProgram
              .map((id) => `type::thing('${id}')`)
              .join(", ")}]
        `;
        const exercisesResult = await this.db.query(exercisesQuery);
        if (Array.isArray(exercisesResult) && exercisesResult.length > 0) {
          allExercises = Array.isArray(exercisesResult[0])
            ? exercisesResult[0]
            : [exercisesResult[0]];
        }
      }
    }

    if (allExercises.length === 0) {
      const fallbackExercisesResult = await this.db.query(`
        SELECT id, nombre, template, proof_point, cohorte
        FROM exercise_instance
        WHERE estado_contenido = 'publicado'
      `);

      if (
        Array.isArray(fallbackExercisesResult) &&
        fallbackExercisesResult.length > 0
      ) {
        allExercises = Array.isArray(fallbackExercisesResult[0])
          ? fallbackExercisesResult[0]
          : [fallbackExercisesResult[0]];
      }
    }

    allExercises = allExercises.filter((exercise) =>
      this.isExerciseAvailableForCohorte(exercise, resolvedCohorteId),
    );

    if (proofPoints.length === 0 && allExercises.length > 0) {
      const proofPointIds = [
        ...new Set(
          allExercises
            .map((e) => e.proof_point)
            .filter((value): value is string => typeof value === "string" && value.length > 0),
        ),
      ];

      if (proofPointIds.length > 0) {
        const proofPointsQuery = `
          SELECT id, nombre
          FROM proof_point
          WHERE id IN [${proofPointIds
            .map((id) => `type::thing('${id}')`)
            .join(", ")}]
        `;
        const proofPointsResult = await this.db.query(proofPointsQuery);
        if (
          Array.isArray(proofPointsResult) &&
          proofPointsResult.length > 0
        ) {
          proofPoints = Array.isArray(proofPointsResult[0])
            ? proofPointsResult[0]
            : [proofPointsResult[0]];
        }
      }
    }

    // Calculate overall statistics
    const completedRecords = progressRecords.filter((p) => {
      const status = this.normalizeStatusFromRecord(p);
      return status === "graded" || status === "approved";
    });
    const inProgressRecords = progressRecords.filter((p) => {
      const status = this.normalizeStatusFromRecord(p);
      return (
        status === "in_progress" ||
        status === "requires_iteration" ||
        status === "pending_review"
      );
    });

    const totalTimeInvested = progressRecords.reduce(
      (sum, p) => sum + (p.tiempo_invertido_minutos || 0),
      0,
    );

    const scoresWithValues = completedRecords
      .map((p) => p.final_score ?? p.score_final)
      .filter((value) => value !== null && value !== undefined);

    const averageScore =
      scoresWithValues.length > 0
        ? scoresWithValues.reduce((sum, s) => sum + s, 0) /
          scoresWithValues.length
        : null;

    // Get proof point names
    const proofPointsLookup = proofPoints;

    // Group by proof point
    const proofPointStatsMap = new Map();

    for (const exercise of allExercises) {
      const ppId = exercise.proof_point;
      if (!proofPointStatsMap.has(ppId)) {
        const ppData = proofPointsLookup.find((pp) => pp.id === ppId);
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
        ["approved", "graded"].includes(this.normalizeStatusFromRecord(progress))
      ) {
        stats.completedExercises++;
        stats.timeInvestedMinutes += progress.tiempo_invertido_minutos || 0;
        if (
          progress.final_score !== null &&
          progress.final_score !== undefined
        ) {
          stats.scores.push(progress.final_score);
        } else if (
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
        estado,
        status,
        fecha_completado,
        graded_at,
        score_final,
        final_score,
        ai_score,
        instructor_score,
        manual_feedback,
        feedback_json,
        feedback_data,
        submitted_at,
        tiempo_invertido_minutos
      FROM exercise_progress
      WHERE estudiante = type::thing($estudianteId)
        AND cohorte = type::thing($cohorteId)
        AND submitted_at != NONE
      ORDER BY submitted_at DESC
      LIMIT 10
    `;

    const recentResult = await this.db.query(recentCompletedQuery, {
      estudianteId: resolvedEstudianteId,
      cohorteId: resolvedCohorteId,
    });

    let recentRecords: any[] = [];
    if (Array.isArray(recentResult) && recentResult.length > 0) {
      recentRecords = Array.isArray(recentResult[0])
        ? recentResult[0]
        : [recentResult[0]];
    }

    const exerciseMap = new Map<string, any>();
    for (const exercise of allExercises) {
      exerciseMap.set(exercise.id, exercise);
    }

    const missingExerciseIds = Array.from(
      new Set(
        recentRecords
          .map((record) => record.exercise_instance)
          .filter((exerciseId) => exerciseId && !exerciseMap.has(exerciseId)),
      ),
    );

    if (missingExerciseIds.length > 0) {
      const missingExercisesQuery = `
        SELECT id, nombre, template, proof_point
        FROM exercise_instance
        WHERE id IN [${missingExerciseIds
          .map((id) => `type::thing('${id}')`)
          .join(", ")}]
      `;

      const missingExercisesResult = await this.db.query(missingExercisesQuery);
      const missingExercises = Array.isArray(missingExercisesResult?.[0])
        ? missingExercisesResult[0]
        : Array.isArray(missingExercisesResult)
          ? missingExercisesResult
          : [];

      for (const exercise of missingExercises) {
        if (exercise?.id) {
          exerciseMap.set(exercise.id, exercise);
        }
      }
    }

    const recentCompletedExercises = recentRecords.map((record) => {
      const exercise = exerciseMap.get(record.exercise_instance);
      const status = this.normalizeStatusFromRecord(record);
      return {
        exerciseId: record.exercise_instance,
        exerciseName: exercise?.nombre || "Unknown",
        exerciseTemplate: exercise?.template || "general",
        completedAt:
          record.graded_at || record.fecha_completado || record.submitted_at,
        submittedAt: record.submitted_at,
        status,
        aiScore: record.ai_score ?? null,
        instructorScore: record.instructor_score ?? null,
        manualFeedback: record.manual_feedback ?? null,
        feedbackJson: this.normalizeFeedbackPayload(
          record.feedback_json ?? record.feedback_data ?? null,
        ),
        score: record.final_score ?? record.score_final ?? null,
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

    this.logger.debug(`[getProofPointProgress] Exercises query for proof point ${decodedProofPointId}:`);
    this.logger.debug(`[getProofPointProgress] Exercises result:`, JSON.stringify(exercisesResult));

    let exercises: any[] = [];
    if (Array.isArray(exercisesResult) && exercisesResult.length > 0) {
      // Check if the first element is an object (exercise record)
      // If so, exercisesResult is already the array of exercises
      if (exercisesResult[0] && typeof exercisesResult[0] === 'object' && exercisesResult[0].id) {
        exercises = exercisesResult;
      } else if (Array.isArray(exercisesResult[0])) {
        // Otherwise, it's wrapped in an additional array
        exercises = exercisesResult[0];
      } else {
        exercises = [exercisesResult[0]];
      }
    }

    this.logger.debug(`[getProofPointProgress] Parsed exercises count: ${exercises.length}`);

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
        final_score,
        ai_score,
        instructor_score,
        fecha_inicio,
        fecha_completado,
        submitted_at,
        graded_at,
        feedback_json,
        instructor_feedback,
        fecha_ultimo_acceso,
        cohorte
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
      if (Array.isArray(progressResult[0])) {
        allProgressRecords = progressResult[0];
      } else {
        allProgressRecords = progressResult; // SurrealDbService ya puede devolver un array plano
      }
    }

    const exerciseIds = new Set(
      exercises
        .map((exercise) => this.extractRecordId(exercise.id))
        .filter((id): id is string => Boolean(id)),
    );

    this.logger.debug(
      `[getProofPointProgress] Exercise IDs: ${JSON.stringify([...exerciseIds])}`,
    );
    this.logger.debug(`[getProofPointProgress] All progress records count: ${allProgressRecords.length}`);
    this.logger.debug(`[getProofPointProgress] All progress exercise_instance IDs: ${JSON.stringify(allProgressRecords.map(r => r.exercise_instance))}`);

    const progressRecords = allProgressRecords.filter((record) => {
      const recordExerciseId = this.extractRecordId(record.exercise_instance);
      return recordExerciseId ? exerciseIds.has(recordExerciseId) : false;
    });

    this.logger.debug(`[getProofPointProgress] Filtered progress records count: ${progressRecords.length}`);

    // Si no hay progreso para algunos ejercicios en la cohorte solicitada,
    // intentamos recuperar progreso histórico del mismo estudiante en cualquier cohorte
    // para no perder los completados previos.
    if (progressRecords.length < exercises.length && exerciseIds.size > 0) {
      const exerciseIdsQuery = [...exerciseIds]
        .map((id) => `type::thing('${id}')`)
        .join(", ");

      const fallbackQuery = `
        SELECT
          id,
          exercise_instance,
          estado,
          status,
          porcentaje_completitud,
          score_final,
          final_score,
          ai_score,
          instructor_score,
          fecha_inicio,
          fecha_completado,
          submitted_at,
          graded_at,
          feedback_json,
          instructor_feedback,
          fecha_ultimo_acceso,
          cohorte
        FROM exercise_progress
        WHERE estudiante = type::thing($estudianteId)
          AND exercise_instance IN [${exerciseIdsQuery}]
      `;

      const fallbackResult = await this.db.query(fallbackQuery, {
        estudianteId,
      });

      const fallbackRecords: any[] =
        Array.isArray(fallbackResult) && fallbackResult.length > 0
          ? Array.isArray(fallbackResult[0])
            ? fallbackResult[0]
            : (fallbackResult as any[])
          : [];

      for (const record of fallbackRecords) {
        const recordExerciseId = this.extractRecordId(record.exercise_instance);
        const alreadyIncluded = progressRecords.some(
          (r) =>
            r.id === record.id ||
            this.extractRecordId(r.exercise_instance) === recordExerciseId,
        );

        if (
          recordExerciseId &&
          !alreadyIncluded &&
          exerciseIds.has(recordExerciseId)
        ) {
          progressRecords.push(record);
        }
      }
    }

    // Calculate exercise summaries
    const exerciseSummaries: ExerciseProgressSummaryDto[] = exercises.map(
      (exercise) => {
        const exerciseId =
          this.extractRecordId(exercise.id) || String(exercise.id);

        // Priorizar progreso de la cohorte solicitada; si no existe, usar cualquier cohorte
        const progressCandidates = progressRecords.filter(
          (p) => this.extractRecordId(p.exercise_instance) === exerciseId,
        );
        const progress =
          progressCandidates.find(
            (p) =>
              this.extractRecordId(p.cohorte) &&
              this.extractRecordId(p.cohorte) === cohorteId,
          ) ?? progressCandidates[0];

        let status: ExerciseProgressStatus = "not_started";
        let progressPercentage = 0;
        let score: number | undefined = undefined;
        let lastAccessed: Date | undefined = undefined;

        if (progress) {
          status = this.normalizeStatusFromRecord(progress);
          const storedProgress = progress.porcentaje_completitud || 0;

          if (status === "approved" || status === "graded") {
            progressPercentage = 100;
          } else if (status === "pending_review") {
            progressPercentage = storedProgress > 0 ? storedProgress : 100;
          } else {
            progressPercentage = storedProgress;
          }
          score = progress.final_score ?? progress.score_final ?? undefined;
          lastAccessed = progress.fecha_ultimo_acceso;
        }

        return {
          exerciseId,
          status,
          progress: progressPercentage,
          score,
          lastAccessed,
        };
      },
    );

    // Debug info to verify matching and counting
    this.logger.debug(
      `[getProofPointProgress] Exercise summaries: ${JSON.stringify(
        exerciseSummaries.map((s) => ({
          exerciseId: s.exerciseId,
          status: s.status,
          progress: s.progress,
          score: s.score,
        })),
      )}`,
    );

    // Calculate overall statistics
    const isCompletedStatus = (status: ExerciseProgressStatus) =>
      status === "approved" ||
      status === "graded" ||
      status === "pending_review";

    const completedExercises = exerciseSummaries.filter((e) =>
      isCompletedStatus(e.status),
    ).length;
    const totalExercises = exercises.length;
    const progressPercentage =
      totalExercises > 0
        ? Math.round(
            exerciseSummaries.reduce(
              (sum, summary) =>
                sum +
                (isCompletedStatus(summary.status)
                  ? 100
                  : summary.progress || 0),
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
    const completedProgressRecords = progressRecords.filter((p) => {
      const normalized = this.normalizeStatusFromRecord(p);
      return normalized === "graded" || normalized === "approved";
    });
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
   * Helpers
   */
  private async resolveStudentContext(params: {
    bodyEstudianteId?: string | null;
    bodyCohorteId?: string | null;
    queryEstudianteId?: string | null;
    queryCohorteId?: string | null;
  }) {
    const estudianteId =
      params.bodyEstudianteId?.trim() ||
      params.queryEstudianteId?.trim() ||
      null;

    const cohorteId =
      params.bodyCohorteId?.trim() ||
      params.queryCohorteId?.trim() ||
      null;

    if (!estudianteId || !cohorteId) {
      this.logger.error(`[resolveStudentContext] Missing required parameters:`, {
        bodyEstudianteId: params.bodyEstudianteId,
        bodyCohorteId: params.bodyCohorteId,
        queryEstudianteId: params.queryEstudianteId,
        queryCohorteId: params.queryCohorteId,
      });
      throw new BadRequestException(
        "Los parámetros estudianteId y cohorteId son requeridos",
      );
    }

    // PREVENCIÓN: Validar que el cohorte existe en la base de datos
    const cohortQuery = `SELECT id, programa FROM type::thing($cohorteId)`;
    const cohortResult = await this.db.query(cohortQuery, { cohorteId });
    const cohort = this.extractFirstRecord(cohortResult);

    if (!cohort) {
      this.logger.error(
        `[resolveStudentContext] Cohort not found: ${cohorteId}`,
      );
      throw new BadRequestException(
        `El cohorte ${cohorteId} no existe en la base de datos. ` +
          `Verifica que el estudiante esté inscrito en un cohorte válido.`,
      );
    }

    this.logger.debug(`[resolveStudentContext] Valid cohort found:`, {
      cohorteId,
      programaId: cohort.programa,
    });

    return { estudianteId, cohorteId };
  }

  private async getPublishedExerciseOrThrow(exerciseId: string): Promise<any> {
    const exerciseQuery = `
      SELECT * FROM type::thing($id)
      WHERE estado_contenido = 'publicado'
    `;

    const exerciseResult = await this.db.query(exerciseQuery, {
      id: exerciseId,
    });

    const exercise = this.extractFirstRecord(exerciseResult);

    if (!exercise) {
      throw new NotFoundException(
        `Published exercise not found: ${exerciseId}`,
      );
    }

    return exercise;
  }

  private async findProgressRecord(
    exerciseId: string,
    estudianteId: string,
    cohorteId: string,
  ): Promise<any | null> {
    const query = `
      SELECT * FROM exercise_progress
      WHERE exercise_instance = type::thing($exerciseId)
        AND estudiante = type::thing($estudianteId)
        AND cohorte = type::thing($cohorteId)
      LIMIT 1
    `;

    const result = await this.db.query(query, {
      exerciseId,
      estudianteId,
      cohorteId,
    });

    return this.extractFirstRecord(result);
  }

  private async createProgressRecord(params: {
    exerciseId: string;
    estudianteId: string;
    cohorteId: string;
    estado?: string;
    status?: ExerciseProgressStatus | string;
    porcentajeCompletitud?: number;
    tiempoInvertidoMinutos?: number;
    datosGuardados?: Record<string, any> | any[];
  }): Promise<any | null> {
    const {
      exerciseId,
      estudianteId,
      cohorteId,
      estado,
      status,
      porcentajeCompletitud,
      tiempoInvertidoMinutos,
      datosGuardados,
    } = params;

    const sanitizedDatos = this.normalizeDatosForStorage(
      datosGuardados,
      datosGuardados ?? {},
    );

    const createProgressQuery = `
      CREATE exercise_progress CONTENT {
        exercise_instance: type::thing($exerciseId),
        estudiante: type::thing($estudianteId),
        cohorte: type::thing($cohorteId),
        estado: $estado,
        status: $status,
        porcentaje_completitud: $porcentaje,
        fecha_inicio: time::now(),
        -- optional fields must be set to NONE instead of null to satisfy Surreal schema
        submitted_at: none,
        instructor_feedback: {},
        datos_guardados: $datosGuardados,
        datos: $datosGuardados,
        tiempo_invertido_minutos: $tiempo,
        numero_intentos: 1,
        created_at: time::now(),
        updated_at: time::now()
      }
    `;

    const createResult = await this.db.query(createProgressQuery, {
      exerciseId,
      estudianteId,
      cohorteId,
      estado: estado ?? "en_progreso",
      status: status ?? "in_progress",
      porcentaje: Math.max(0, Math.min(100, porcentajeCompletitud ?? 0)),
      tiempo: Math.max(0, tiempoInvertidoMinutos ?? 0),
      datosGuardados: sanitizedDatos,
    });

    return this.extractFirstRecord(createResult);
  }

  private normalizeDatosForStorage(
    raw: any,
    fallback: any = {},
  ): Record<string, any> | any[] {
    if (raw === undefined || raw === null) {
      return fallback ?? {};
    }

    try {
      const cloned = JSON.parse(JSON.stringify(raw));
      if (cloned && typeof cloned === "object") {
        return cloned;
      }
      return { value: cloned };
    } catch (error) {
      this.logger.warn(
        `[normalizeDatosForStorage] No se pudo serializar datos, usando fallback`,
        error instanceof Error ? error.message : error,
      );
      return fallback ?? {};
    }
  }

  private extractFirstRecord(result: any): any | null {
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        return result[0][0];
      }
      if (!Array.isArray(result[0])) {
        return result[0];
      }
    }
    return null;
  }

  private resolveListLimit(limitParam?: string, fallback: number = 25): number {
    if (!limitParam) {
      return fallback;
    }
    const parsed = parseInt(limitParam, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return fallback;
    }
    return Math.min(parsed, 100);
  }

  private async fetchStudentNames(
    studentIds: string[],
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (studentIds.length === 0) {
      return map;
    }

    const query = `
      SELECT id, metadata
      FROM estudiante
      WHERE id IN [${studentIds
        .map((id) => `type::thing('${id}')`)
        .join(", ")}]
    `;

    const result = await this.db.query(query);
    const records = Array.isArray(result?.[0])
      ? result[0]
      : Array.isArray(result)
        ? result
        : [];

    for (const student of records) {
      if (student?.id) {
        map.set(
          student.id,
          this.resolveStudentDisplayName(student),
        );
      }
    }

    return map;
  }

  private async fetchExerciseNames(
    exerciseIds: string[],
  ): Promise<Map<string, string>> {
    const map = new Map<string, string>();
    if (exerciseIds.length === 0) {
      return map;
    }

    const query = `
      SELECT id, nombre
      FROM exercise_instance
      WHERE id IN [${exerciseIds
        .map((id) => `type::thing('${id}')`)
        .join(", ")}]
    `;

    const result = await this.db.query(query);
    const records = Array.isArray(result?.[0])
      ? result[0]
      : Array.isArray(result)
        ? result
        : [];

    for (const exercise of records) {
      if (exercise?.id) {
        map.set(exercise.id, exercise?.nombre || exercise.id);
      }
    }

    return map;
  }

  private resolveStudentDisplayName(student: any): string {
    const nameCandidates = [
      student?.metadata?.nombre,
      student?.metadata?.nombreCompleto,
      student?.metadata?.nombre_completo,
    ].filter(
      (value) => typeof value === "string" && value.trim().length > 0,
    );

    if (nameCandidates.length > 0) {
      return (nameCandidates[0] as string).trim();
    }

    if (typeof student?.id === "string") {
      return student.id;
    }

    return "Estudiante";
  }

  private decodeExerciseId(id: string): string {
    let decoded = decodeURIComponent(id);
    if (decoded.includes("%")) {
      decoded = decodeURIComponent(decoded);
    }
    return decoded;
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

Recuerda citar explícitamente las secciones que utilises y mantener el tono socrático.`;

    // Prepare Shadow Monitor tasks (run in parallel with main AI call)
    const shadowMonitorPromises: Promise<any>[] = [];
    let shouldRunSimulationEval = false;
    let shouldRunMentorValidation = false;
    let shouldRunInsightExtraction = false;

    // 1. Simulación de Interacción - Evaluate success criteria
    if (
      assistantDto.criteriosExito &&
      assistantDto.criteriosExito.length > 0 &&
      assistantDto.shadowMonitorConfig?.activado !== false
    ) {
      const historyLength = limitedHistory.length;
      const frecuencia =
        assistantDto.shadowMonitorConfig?.frecuencia_turnos || 2;

      // Only evaluate every N turns (to avoid excessive API calls)
      if (historyLength > 0 && historyLength % frecuencia === 0) {
        shouldRunSimulationEval = true;
        const recentMessages = limitedHistory.slice(-6); // Last 6 messages for context
        const criteriaToEvaluate = assistantDto.criteriosExito.filter(
          (c) => !assistantDto.criteriosCumplidos?.includes(c.id),
        );

        if (criteriaToEvaluate.length > 0) {
          shadowMonitorPromises.push(
            this.shadowMonitor.evaluateSimulationCriteria({
              recentMessages,
              criteriaToEvaluate,
              alreadyMetCriteria: assistantDto.criteriosCumplidos || [],
            }),
          );
        }
      }
    }

    // 2. Mentor/Asesor IA - Validate step response quality
    if (
      assistantDto.criteriosValidacion &&
      assistantDto.criteriosValidacion.length > 0
    ) {
      shouldRunMentorValidation = true;
      shadowMonitorPromises.push(
        this.shadowMonitor.validateMentorStepQuality({
          studentResponse: assistantDto.pregunta,
          stepTitle: assistantDto.seccionTitulo,
          evaluationCriteria: assistantDto.criteriosValidacion,
          qualityThreshold: assistantDto.umbralCalidad || 3,
        }),
      );
    }

    // 3. Metacognición - Extract insights
    if (
      assistantDto.perfilComprension?.tipo === "metacognicion" &&
      limitedHistory.length > 0
    ) {
      shouldRunInsightExtraction = true;
      const recentMessages = limitedHistory.slice(-4);
      shadowMonitorPromises.push(
        this.shadowMonitor.extractMetacognitionInsights({
          recentMessages,
          currentInsightCount: assistantDto.insightCount || 0,
        }),
      );
    }

    // Execute main AI call and Shadow Monitor in parallel
    const [aiResponse, ...shadowResults] = await Promise.all([
      this.openAIService.generateChatResponse({
        systemPrompt,
        messages: [...limitedHistory, { role: "user", content: userContent }],
        maxTokens: 7500,
      }),
      ...shadowMonitorPromises,
    ]);

    const { content, raw } = aiResponse;
    const { references, answer: extractedAnswer } =
      this.extractAssistantAnswer(content);
    let answer = extractedAnswer;

    if (!answer) {
      answer = this.buildAssistantFallback(assistantDto);
    }

    // Build response with Shadow Monitor results
    const response: LessonAssistantResponseDto = {
      respuesta: answer,
      referencias:
        references.length > 0
          ? references
          : [assistantDto.seccionTitulo].filter(Boolean),
      tokensUsados: raw.usage?.total_tokens,
    };

    // Add Shadow Monitor results to response
    let resultIndex = 0;
    if (shouldRunSimulationEval && shadowResults[resultIndex]) {
      response.shadowMonitorResult = shadowResults[resultIndex];
      resultIndex++;
    }
    if (shouldRunMentorValidation && shadowResults[resultIndex]) {
      response.validationResult = shadowResults[resultIndex];
      resultIndex++;
    }
    if (shouldRunInsightExtraction && shadowResults[resultIndex]) {
      response.insightsResult = shadowResults[resultIndex];
      resultIndex++;
    }

    return response;
  }

  /**
   * Send lesson assistant message with streaming response (SSE)
   */
  @Public()
  @Post("student/exercises/:exerciseId/assistant/chat/stream")
  @ApiOperation({
    summary: "Enviar pregunta al asistente con streaming (SSE)",
    description:
      "El asistente responde en tiempo real usando Server-Sent Events, reduciendo la sensación de latencia.",
  })
  async sendLessonAssistantMessageStream(
    @Param("exerciseId") exerciseId: string,
    @Body() assistantDto: LessonAssistantRequestDto,
    @Res() response: any,
  ): Promise<void> {
    try {
      // Set up SSE headers
      response.setHeader("Content-Type", "text/event-stream");
      response.setHeader("Cache-Control", "no-cache");
      response.setHeader("Connection", "keep-alive");
      response.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

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

      // Send a "start" event
      response.write(`data: ${JSON.stringify({ type: "start" })}\n\n`);

      // Stream the response
      let fullContent = "";
      const stream = this.openAIService.generateChatResponseStream({
        systemPrompt,
        messages: [
          ...limitedHistory,
          { role: "user", content: userContent },
        ],
        maxTokens: 7500,
      });

      for await (const chunk of stream) {
        fullContent += chunk;
        response.write(
          `data: ${JSON.stringify({ type: "chunk", content: chunk })}\n\n`,
        );
      }

      // Extract references and send complete event
      const { references } = this.extractAssistantAnswer(fullContent);

      response.write(
        `data: ${JSON.stringify({
          type: "done",
          referencias:
            references.length > 0
              ? references
              : [assistantDto.seccionTitulo].filter(Boolean),
        })}\n\n`,
      );

      response.end();
    } catch (error) {
      this.logger.error("Error in streaming assistant response", error.stack);
      response.write(
        `data: ${JSON.stringify({
          type: "error",
          error: "Error generando respuesta",
        })}\n\n`,
      );
      response.end();
    }
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
    const mappedStatus = this.normalizeStatusFromString(progress?.status);
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
      case "pending_review":
      case "submitted_for_review":
      case "requires_iteration":
      case "approved":
      case "graded":
        return status;
      default:
        return null;
    }
  }

  private normalizeStatusFromString(
    status?: string | null,
  ): ExerciseProgressStatus {
    const mapped = this.mapStatus(status);
    if (mapped === "submitted_for_review") {
      return "pending_review";
    }
    if (mapped === "approved") {
      return "graded";
    }
    return mapped ?? "not_started";
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
        return "pending_review";
      case "revision_requerida":
        return "requires_iteration";
      case "completado":
        return "graded";
      default:
        return "not_started";
    }
  }

  private isSubmissionLockedStatus(
    status: ExerciseProgressStatus,
  ): boolean {
    return status === "pending_review" || status === "graded";
  }

  /**
   * Helper to map database record to DTO
   */
  private mapProgressToDto(progress: any): ExerciseProgressResponseDto {
    const status = this.normalizeStatusFromRecord(progress);
    const datosGuardados =
      progress?.datos_guardados ??
      progress?.datos ??
      {};

    // CORRECCIÓN: Mapear explícitamente feedback_json a feedbackJson
    const feedbackJson = this.normalizeFeedbackPayload(
      progress.feedback_json ?? progress.feedback_data ?? null,
    );

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
      gradedAt: progress.graded_at,
      tiempoInvertidoMinutos: progress.tiempo_invertido_minutos,
      numeroIntentos: progress.numero_intentos,
      aiScore: progress.ai_score ?? null,
      instructorScore: progress.instructor_score ?? null,
      scoreFinal: progress.final_score ?? progress.score_final ?? null,
      manualFeedback: progress.manual_feedback ?? null,
      feedbackJson,
      // CORRECCIÓN: Mapear instructor_feedback correctamente, priorizando datos del feedback estructurado
      instructorFeedback: feedbackJson?.instructor_comments
        ? { comments: feedbackJson.instructor_comments }
        : (progress.instructor_feedback ?? {}),
      datosGuardados,
      createdAt: progress.created_at,
      updatedAt: progress.updated_at,
    };
  }

  private normalizeFeedbackPayload(
    payload: any,
  ): Record<string, any> | null {
    if (payload === null || payload === undefined) {
      return null;
    }

    if (typeof payload === "string") {
      try {
        return JSON.parse(payload);
      } catch (error) {
        return { raw: payload };
      }
    }

    if (typeof payload === "object") {
      try {
        return JSON.parse(JSON.stringify(payload));
      } catch (error) {
        return payload;
      }
    }

    return null;
  }

  private mapCohortProgressRecord(
    record: any,
    studentNameMap: Map<string, string>,
  ): CohortProgressOverviewRecordDto {
    const estudianteId = this.extractRecordId(record.estudiante) ?? "";
    const exerciseInstanceId =
      this.extractRecordId(record.exercise_instance) ?? "";
    const status = this.normalizeStatusFromRecord(record);
    const porcentajeCompletitud = this.resolveProgressPercentageValue(
      record,
      status,
    );

    return {
      progressId: record.id,
      estudianteId,
      estudianteNombre: estudianteId
        ? studentNameMap.get(estudianteId)
        : undefined,
      exerciseInstanceId,
      status,
      porcentajeCompletitud,
      aiScore: this.normalizeScoreValue(record.ai_score),
      instructorScore: this.normalizeScoreValue(record.instructor_score),
      finalScore: this.normalizeScoreValue(
        record.final_score ?? record.score_final,
      ),
      submittedAt: record.submitted_at ?? null,
      gradedAt: record.graded_at ?? record.fecha_completado ?? null,
      updatedAt: record.updated_at ?? null,
      tiempoInvertidoMinutos:
        typeof record.tiempo_invertido_minutos === "number"
          ? record.tiempo_invertido_minutos
          : null,
      manualFeedback:
        record.manual_feedback ??
        record.instructor_feedback ??
        null,
      feedbackJson: this.normalizeFeedbackPayload(
        record.feedback_json ?? record.feedback_data ?? null,
      ),
    };
  }

  private resolveProgressPercentageValue(
    record: any,
    status: ExerciseProgressStatus,
  ): number {
    if (typeof record?.porcentaje_completitud === "number") {
      return Math.max(0, Math.min(100, record.porcentaje_completitud));
    }
    if (status === "graded" || status === "approved" || status === "pending_review") {
      return 100;
    }
    return 0;
  }

  private normalizeScoreValue(value: any): number | null {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return null;
    }
    if (!Number.isFinite(value)) {
      return null;
    }
    return Math.max(0, Math.min(100, Number(value)));
  }
}
