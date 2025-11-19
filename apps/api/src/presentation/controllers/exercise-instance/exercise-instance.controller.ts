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
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AddExerciseToProofPointUseCase } from "../../../application/exercise-instance/use-cases/AddExerciseToProofPoint/AddExerciseToProofPointUseCase";
import { GenerateExerciseContentUseCase } from "../../../application/exercise-instance/use-cases/GenerateExerciseContent/GenerateExerciseContentUseCase";
import { AnalyzeDraftUseCase } from "../../../application/exercise-instance/use-cases/AnalyzeDraft/AnalyzeDraftUseCase";
import { SimulateRoleplayUseCase } from "../../../application/exercise-instance/use-cases/interactions/SimulateRoleplayUseCase";
import { GetSocraticGuidanceUseCase } from "../../../application/exercise-instance/use-cases/interactions/GetSocraticGuidanceUseCase";
import { ProcessSimulationTurnUseCase } from "../../../application/exercise-instance/use-cases/interactions/ProcessSimulationTurnUseCase";
import { IExerciseInstanceRepository } from "../../../domain/exercise-instance/repositories/IExerciseInstanceRepository";
import {
  ContentStatus,
  ContentStatusType,
} from "../../../domain/exercise-instance/value-objects/ContentStatus";
import {
  AddExerciseToProofPointRequestDto,
  UpdateExerciseInstanceRequestDto,
  ExerciseInstanceResponseDto,
  GenerateContentRequestDto,
  GenerateContentResponseDto,
  AnalyzeDraftRequestDto,
  AnalyzeDraftResponseDto,
  InteractionRequestDto,
  RoleplayResponseDto,
  MentorResponseDto,
  SimulationResponseDto,
} from "../../dtos/exercise-instance";
import { SurrealDbService } from "../../../core/database/surrealdb.service";
import { Public } from "../../../core/decorators";

/**
 * ExerciseInstanceController
 * REST API endpoints for Exercise Instance Management
 */
@ApiTags("exercise-instances")
@Controller()
@ApiBearerAuth("JWT-auth")
export class ExerciseInstanceController {
  private readonly logger = new Logger(ExerciseInstanceController.name);

  constructor(
    private readonly addExerciseUseCase: AddExerciseToProofPointUseCase,
    private readonly generateContentUseCase: GenerateExerciseContentUseCase,
    private readonly analyzeDraftUseCase: AnalyzeDraftUseCase,
    private readonly simulateRoleplayUseCase: SimulateRoleplayUseCase,
    private readonly getSocraticGuidanceUseCase: GetSocraticGuidanceUseCase,
    private readonly processSimulationTurnUseCase: ProcessSimulationTurnUseCase,
    @Inject("IExerciseInstanceRepository")
    private readonly exerciseInstanceRepository: IExerciseInstanceRepository,
    private readonly db: SurrealDbService,
  ) {}

  /**
   * Add exercise to proof point
   */
  @Post("proof-points/:proofPointId/exercises")
  @ApiOperation({
    summary: "Add exercise to proof point",
    description: "Creates a new exercise instance within a proof point",
  })
  @ApiParam({
    name: "proofPointId",
    description: "ProofPoint ID",
    example: "proof_point:abc123",
  })
  @ApiResponse({
    status: 201,
    description: "Exercise created successfully",
    type: ExerciseInstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: "ProofPoint or Template not found" })
  @ApiResponse({ status: 400, description: "Invalid configuration" })
  async addExercise(
    @Param("proofPointId") proofPointId: string,
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
        const query = "SELECT * FROM type::thing($id)";
        const dbResult = await this.db.query(query, {
          id: response.exerciseInstanceId,
        });

        let exercise: any;
        if (Array.isArray(dbResult) && dbResult.length > 0) {
          if (Array.isArray(dbResult[0]) && dbResult[0].length > 0) {
            exercise = dbResult[0][0];
          } else if (!Array.isArray(dbResult[0])) {
            exercise = dbResult[0];
          }
        }

        if (!exercise) {
          throw new NotFoundException(
            `Exercise not found: ${response.exerciseInstanceId}`,
          );
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
        if (error.message.includes("not found")) {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      },
    });
  }

  /**
   * List exercises by proof point
   */
  @Get("proof-points/:proofPointId/exercises")
  @ApiOperation({
    summary: "List proof point exercises",
    description: "Get all exercises for a specific proof point",
  })
  @ApiParam({
    name: "proofPointId",
    description: "ProofPoint ID",
    example: "proof_point:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "List of exercises",
    type: [ExerciseInstanceResponseDto],
  })
  async listExercisesByProofPoint(
    @Param("proofPointId") proofPointId: string,
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
  @Get("exercises/:id")
  @ApiOperation({
    summary: "Get exercise by ID",
    description:
      "Retrieve detailed information about a specific exercise instance",
  })
  @ApiParam({
    name: "id",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Exercise details",
    type: ExerciseInstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: "Exercise not found" })
  async getExercise(
    @Param("id") id: string,
  ): Promise<ExerciseInstanceResponseDto> {
    const decodedId = decodeURIComponent(id);

    // Query database directly
    const result = await this.db.query("SELECT * FROM type::thing($id)", {
      id: decodedId,
    });

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
  @Post("exercises/:id/generate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Generate AI content",
    description:
      "Generates AI-powered content for an exercise instance using GPT",
  })
  @ApiParam({
    name: "id",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Content generated successfully",
    type: GenerateContentResponseDto,
  })
  @ApiResponse({ status: 404, description: "Exercise not found" })
  @ApiResponse({ status: 400, description: "Content generation failed" })
  async generateContent(
    @Param("id") id: string,
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
        if (error.message.includes("not found")) {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      },
    });
  }

  /**
   * Get exercise content
   */
  @Get("exercises/:id/content")
  @ApiOperation({
    summary: "Get exercise content",
    description: "Get the generated AI content for an exercise instance",
  })
  @ApiParam({
    name: "id",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Exercise content",
  })
  @ApiResponse({ status: 404, description: "Exercise or content not found" })
  async getExerciseContent(@Param("id") id: string): Promise<any> {
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
  @Put("exercises/:id")
  @ApiOperation({
    summary: "Update exercise",
    description: "Update an existing exercise instance",
  })
  @ApiParam({
    name: "id",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Exercise updated successfully",
    type: ExerciseInstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: "Exercise not found" })
  async updateExercise(
    @Param("id") id: string,
    @Body() updateDto: UpdateExerciseInstanceRequestDto,
  ): Promise<ExerciseInstanceResponseDto> {
    const decodedId = decodeURIComponent(id);

    // Build update fields dynamically based on what's provided
    const updateFields: string[] = [];
    const params: Record<string, any> = { id: decodedId };

    if (updateDto.nombre !== undefined) {
      updateFields.push("nombre = $nombre");
      params.nombre = updateDto.nombre;
    }

    if (updateDto.descripcionBreve !== undefined) {
      updateFields.push("descripcion_breve = $descripcionBreve");
      params.descripcionBreve = updateDto.descripcionBreve;
    }

    if (updateDto.consideracionesContexto !== undefined) {
      updateFields.push("consideraciones_contexto = $consideracionesContexto");
      params.consideracionesContexto = updateDto.consideracionesContexto;
    }

    if (updateDto.configuracionPersonalizada !== undefined) {
      updateFields.push("configuracion_personalizada = $configuracionPersonalizada");
      params.configuracionPersonalizada = updateDto.configuracionPersonalizada;
    }

    if (updateDto.duracionEstimadaMinutos !== undefined) {
      updateFields.push("duracion_estimada_minutos = $duracionEstimadaMinutos");
      params.duracionEstimadaMinutos = updateDto.duracionEstimadaMinutos;
    }

    if (updateDto.esObligatorio !== undefined) {
      updateFields.push("es_obligatorio = $esObligatorio");
      params.esObligatorio = updateDto.esObligatorio;
    }

    // Always update the updated_at timestamp
    updateFields.push("updated_at = time::now()");

    if (updateFields.length === 1) {
      // Only updated_at, no actual changes
      throw new BadRequestException("No fields to update");
    }

    // Update using direct database query
    const query = `
      UPDATE type::thing($id) SET
        ${updateFields.join(",\n        ")}
      RETURN AFTER
    `;

    const result = await this.db.query(query, params);

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
  @Put("exercises/:id/publish")
  @ApiOperation({
    summary: "Publish exercise",
    description: "Change exercise content status to published",
  })
  @ApiParam({
    name: "id",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Exercise published successfully",
    type: ExerciseInstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: "Exercise not found" })
  @ApiResponse({
    status: 400,
    description: "Exercise must be in a publishable state (generado or draft)",
  })
  async publishExercise(
    @Param("id") id: string,
  ): Promise<ExerciseInstanceResponseDto> {
    const decodedId = decodeURIComponent(id);

    // First, check if exercise exists and is in draft state
    const checkQuery = "SELECT * FROM type::thing($id)";
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

    const contentStatus = ContentStatus.create(
      exercise.estado_contenido as ContentStatusType,
    );

    if (!contentStatus.canPublish()) {
      throw new BadRequestException(
        `Exercise must be in a publishable state (generado or draft) to publish. Current state: ${exercise.estado_contenido}`,
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
   * Reset stuck exercise (change status from generando to error)
   */
  @Put("exercises/:id/reset")
  @ApiOperation({
    summary: "Reset stuck exercise",
    description: "Reset an exercise stuck in 'generando' state to 'error' state so it can be retried",
  })
  @ApiParam({
    name: "id",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Exercise reset successfully",
    type: ExerciseInstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: "Exercise not found" })
  @ApiResponse({
    status: 400,
    description: "Exercise must be in generando state to reset",
  })
  async resetStuckExercise(
    @Param("id") id: string,
  ): Promise<ExerciseInstanceResponseDto> {
    const decodedId = decodeURIComponent(id);

    // First, check if exercise exists and is in generando state
    const checkQuery = "SELECT * FROM type::thing($id)";
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

    const contentStatus = ContentStatus.create(
      exercise.estado_contenido as ContentStatusType,
    );

    // Allow reset from generando state
    if (!contentStatus.isGenerando()) {
      throw new BadRequestException(
        `Exercise must be in 'generando' state to reset. Current state: ${exercise.estado_contenido}`,
      );
    }

    // Update status to error
    const updateQuery = `
      UPDATE type::thing($id) SET
        estado_contenido = 'error',
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
   * Unpublish exercise (change status from published to draft)
   */
  @Put("exercises/:id/unpublish")
  @ApiOperation({
    summary: "Unpublish exercise",
    description: "Change exercise content status from published back to draft",
  })
  @ApiParam({
    name: "id",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Exercise unpublished successfully",
    type: ExerciseInstanceResponseDto,
  })
  @ApiResponse({ status: 404, description: "Exercise not found" })
  @ApiResponse({
    status: 400,
    description: "Exercise must be published to unpublish",
  })
  async unpublishExercise(
    @Param("id") id: string,
  ): Promise<ExerciseInstanceResponseDto> {
    const decodedId = decodeURIComponent(id);

    // First, check if exercise exists and is published
    const checkQuery = "SELECT * FROM type::thing($id)";
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

    const contentStatus = ContentStatus.create(
      exercise.estado_contenido as ContentStatusType,
    );

    if (!contentStatus.canUnpublish()) {
      throw new BadRequestException(
        `Exercise must be published to unpublish. Current state: ${exercise.estado_contenido}`,
      );
    }

    // Update status to draft
    const updateQuery = `
      UPDATE type::thing($id) SET
        estado_contenido = 'draft',
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
  @Delete("exercises/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete exercise",
    description: "Permanently delete an exercise instance",
  })
  @ApiParam({
    name: "id",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({ status: 204, description: "Exercise deleted successfully" })
  @ApiResponse({ status: 404, description: "Exercise not found" })
  async deleteExercise(@Param("id") id: string): Promise<void> {
    const decodedId = decodeURIComponent(id);

    // Delete using direct database query
    const query = "DELETE type::thing($id) RETURN BEFORE";
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
  @Public()
  @Get("student/proof-points/:proofPointId/exercises")
  @ApiOperation({
    summary: "Get published exercises for students",
    description:
      "Get all published exercises for a specific proof point (student view)",
  })
  @ApiParam({
    name: "proofPointId",
    description: "ProofPoint ID",
    example: "proof_point:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "List of published exercises",
    type: [ExerciseInstanceResponseDto],
  })
  async getPublishedExercisesByProofPoint(
    @Param("proofPointId") proofPointId: string,
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
      consideracionesContexto: "", // Don't expose to students
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
  @Public()
  @Get("student/exercises/:id")
  @ApiOperation({
    summary: "Get published exercise for student",
    description: "Get a specific exercise if it is published",
  })
  @ApiParam({
    name: "id",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Exercise details",
    type: ExerciseInstanceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Exercise not found or not published",
  })
  async getPublishedExercise(
    @Param("id") id: string,
    @Query("estudianteId") estudianteId?: string,
    @Query("cohorteId") cohorteId?: string,
  ): Promise<ExerciseInstanceResponseDto> {
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

    const resolvedEstudianteId = estudianteId?.trim() || null;
    const resolvedCohorteId = cohorteId?.trim() || null;

    let savedData: any = undefined;
    let progressStatus: string | undefined;
    let progressPercentage: number | undefined;

    if (resolvedEstudianteId && resolvedCohorteId) {
      try {
        const progressQuery = `
          SELECT id, datos_guardados, status, estado, porcentaje_completitud
          FROM exercise_progress
          WHERE exercise_instance = type::thing($exerciseId)
            AND estudiante = type::thing($estudianteId)
            AND cohorte = type::thing($cohorteId)
          LIMIT 1
        `;

        const progressResult = await this.db.query(progressQuery, {
          exerciseId: decodedId,
          estudianteId: resolvedEstudianteId,
          cohorteId: resolvedCohorteId,
        });

        let progress: any;
        if (Array.isArray(progressResult) && progressResult.length > 0) {
          if (Array.isArray(progressResult[0]) && progressResult[0].length > 0) {
            progress = progressResult[0][0];
          } else if (!Array.isArray(progressResult[0])) {
            progress = progressResult[0];
          }
        }

        if (progress) {
          savedData =
            progress.datos_guardados ??
            progress.datos ??
            undefined;
          progressStatus = progress.status || progress.estado;
          progressPercentage = progress.porcentaje_completitud;
        }
      } catch (error) {
        this.logger.warn(
          `No se pudo recuperar progreso previo del ejercicio ${decodedId}: ${
            error instanceof Error ? error.message : error
          }`,
        );
      }
    }

    return {
      id: exercise.id,
      template: exercise.template,
      proofPoint: exercise.proof_point,
      nombre: exercise.nombre,
      descripcionBreve: exercise.descripcion_breve,
      consideracionesContexto: "", // Don't expose to students
      configuracionPersonalizada: exercise.configuracion_personalizada,
      orden: exercise.orden,
      duracionEstimadaMinutos: exercise.duracion_estimada_minutos,
      estadoContenido: exercise.estado_contenido,
      contenidoActual: exercise.contenido_actual,
      esObligatorio: exercise.es_obligatorio,
      createdAt: exercise.created_at,
      updatedAt: exercise.updated_at,
      savedData,
      progressStatus,
      progressPercentage,
    };
  }

  /**
   * Analyze draft against rubric criteria (Student endpoint)
   */
  @Public()
  @Post("student/exercises/:id/analyze-draft")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Analyze student draft",
    description:
      "Analyzes a student's draft text against the rubric criteria and provides formative feedback",
  })
  @ApiParam({
    name: "id",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Draft analysis with suggestions",
    type: AnalyzeDraftResponseDto,
  })
  @ApiResponse({ status: 404, description: "Exercise or content not found" })
  @ApiResponse({ status: 400, description: "Analysis failed" })
  async analyzeDraftStudent(
    @Param("id") id: string,
    @Body() analyzeDraftDto: AnalyzeDraftRequestDto,
  ): Promise<AnalyzeDraftResponseDto> {
    return this.handleAnalyzeDraft(id, analyzeDraftDto);
  }

  /**
   * Analyze draft alias for backwards compatibility (Tutor IA Proactivo)
   */
  @Public()
  @Post("exercises/:id/analyze-draft")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Analyze student draft (general endpoint)",
    description:
      "Alias endpoint that enables proactive tutor feedback without the /student prefix",
  })
  @ApiParam({
    name: "id",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Draft analysis with suggestions",
    type: AnalyzeDraftResponseDto,
  })
  async analyzeDraft(
    @Param("id") id: string,
    @Body() analyzeDraftDto: AnalyzeDraftRequestDto,
  ): Promise<AnalyzeDraftResponseDto> {
    return this.handleAnalyzeDraft(id, analyzeDraftDto);
  }

  /**
   * Get published exercise content (Student endpoint)
   */
  @Public()
  @Get("student/exercises/:id/content")
  @ApiOperation({
    summary: "Get published exercise content for student",
    description: "Get the content of a published exercise",
  })
  @ApiParam({
    name: "id",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Exercise content",
  })
  @ApiResponse({ status: 404, description: "Exercise or content not found" })
  async getPublishedExerciseContent(@Param("id") id: string): Promise<any> {
    const decodedId = decodeURIComponent(id);

    // First verify the exercise is published
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
      throw new NotFoundException(`Published exercise not found: ${id}`);
    }

    // Query exercise content
    const contentQuery = `
      SELECT * FROM exercise_content
      WHERE exercise_instance = type::thing($exerciseId)
        OR exercise_instance = $exerciseId
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
   * AI Interaction: Roleplay Simulation
   * Used by SimulacionInteraccionPlayer component
   */
  @Public()
  @Post("exercises/:id/interact/roleplay")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Roleplay interaction",
    description:
      "Process a roleplay/simulation interaction where the student practices communication with an AI character",
  })
  @ApiParam({
    name: "id",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Character response with evaluation",
    type: RoleplayResponseDto,
  })
  async interactRoleplay(
    @Param("id") id: string,
    @Body() interactionDto: InteractionRequestDto,
  ): Promise<RoleplayResponseDto> {
    const result = await this.simulateRoleplayUseCase.execute({
      exerciseInstanceId: id,
      userMessage: interactionDto.accionUsuario,
      conversationHistory: interactionDto.historial,
      currentState: interactionDto.estadoActual,
    });

    return result.match({
      ok: (response) => ({
        reply: response.reply,
        objectivesMet: response.objectivesMet,
        emotionalState: response.emotionalState,
        evaluation: response.evaluation,
        shouldEnd: response.shouldEnd,
      }),
      fail: (error) => {
        if (error.message.includes("not found")) {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      },
    });
  }

  /**
   * AI Interaction: Socratic Mentor
   * Used by MentorIAPlayer component
   */
  @Public()
  @Post("exercises/:id/interact/mentor")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Get Socratic guidance",
    description:
      "Request AI mentor guidance without giving direct answers, using Socratic questioning",
  })
  @ApiParam({
    name: "id",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Mentor guidance with follow-up questions",
    type: MentorResponseDto,
  })
  async interactMentor(
    @Param("id") id: string,
    @Body() interactionDto: InteractionRequestDto,
  ): Promise<MentorResponseDto> {
    const result = await this.getSocraticGuidanceUseCase.execute({
      exerciseInstanceId: id,
      studentInput: interactionDto.accionUsuario,
      currentStep: interactionDto.contexto?.currentStep,
      context: {
        stepTitle: interactionDto.contexto?.stepTitle,
        stepDescription: interactionDto.contexto?.stepDescription,
        previousAttempts: interactionDto.estadoActual?.previousAttempts,
      },
    });

    return result.match({
      ok: (response) => ({
        guidance: response.guidance,
        followUpQuestions: response.followUpQuestions,
        references: response.references,
        encouragementLevel: response.encouragementLevel,
      }),
      fail: (error) => {
        if (error.message.includes("not found")) {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      },
    });
  }

  /**
   * AI Interaction: Environment Simulation
   * Used by SimuladorEntornoPlayer component
   */
  @Public()
  @Post("exercises/:id/interact/simulation")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Process simulation turn",
    description:
      "Process a turn in an environment simulation, calculating variable changes and narrative",
  })
  @ApiParam({
    name: "id",
    description: "ExerciseInstance ID",
    example: "exercise_instance:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Simulation result with updated state",
    type: SimulationResponseDto,
  })
  async interactSimulation(
    @Param("id") id: string,
    @Body() interactionDto: InteractionRequestDto,
  ): Promise<SimulationResponseDto> {
    const result = await this.processSimulationTurnUseCase.execute({
      exerciseInstanceId: id,
      studentId: interactionDto.contexto?.studentId,
      action: interactionDto.accionUsuario,
      currentState: interactionDto.estadoActual || {},
    });

    return result.match({
      ok: (response) => ({
        narrativa: response.narrativa,
        estadoActualizado: response.estadoActualizado,
        eventos: response.eventos,
        finalizado: response.finalizado,
        resultado: response.resultado,
      }),
      fail: (error) => {
        if (error.message.includes("not found")) {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      },
    });
  }

  private async handleAnalyzeDraft(
    id: string,
    analyzeDraftDto: AnalyzeDraftRequestDto,
  ): Promise<AnalyzeDraftResponseDto> {
    const result = await this.analyzeDraftUseCase.execute({
      exerciseInstanceId: id,
      questionId: analyzeDraftDto.questionId,
      draftText: analyzeDraftDto.draftText,
    });

    return result.match({
      ok: (response) => ({
        questionId: response.questionId,
        suggestion: response.suggestion,
        strengths: response.strengths,
        improvements: response.improvements,
        rubricAlignment: response.rubricAlignment,
      }),
      fail: (error) => {
        if (error.message.includes("not found")) {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      },
    });
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
