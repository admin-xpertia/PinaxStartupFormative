import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { CreateProgramUseCase } from "../../../application/program-design/use-cases/CreateProgram/CreateProgramUseCase";
import { PublishProgramUseCase } from "../../../application/program-design/use-cases/PublishProgram/PublishProgramUseCase";
import { ArchiveProgramUseCase } from "../../../application/program-design/use-cases/ArchiveProgram/ArchiveProgramUseCase";
import { RecommendExercisePlanUseCase } from "../../../application/program-design/use-cases/RecommendExercisePlan/RecommendExercisePlanUseCase";
import { AddExerciseToProofPointUseCase } from "../../../application/exercise-instance/use-cases/AddExerciseToProofPoint/AddExerciseToProofPointUseCase";
import {
  IProgramRepository,
  IFaseRepository,
  IProofPointRepository,
} from "../../../domain/program-design/repositories/IProgramRepository";
import { IExerciseInstanceRepository } from "../../../domain/exercise-instance/repositories/IExerciseInstanceRepository";
import { RecordId } from "../../../domain/shared/value-objects/RecordId";
import { ProgramStatus } from "../../../domain/program-design/value-objects/ProgramStatus";
import {
  CreateProgramRequestDto,
  UpdateProgramRequestDto,
  ProgramResponseDto,
} from "../../dtos/program-design";

/**
 * ProgramController
 * REST API endpoints for Program Design
 */
@ApiTags("programs")
@Controller("programs")
@ApiBearerAuth("JWT-auth")
export class ProgramController {
  private readonly logger = new Logger(ProgramController.name);

  constructor(
    private readonly createProgramUseCase: CreateProgramUseCase,
    private readonly publishProgramUseCase: PublishProgramUseCase,
    private readonly archiveProgramUseCase: ArchiveProgramUseCase,
    private readonly recommendExercisePlanUseCase: RecommendExercisePlanUseCase,
    private readonly addExerciseToProofPointUseCase: AddExerciseToProofPointUseCase,
    @Inject("IProgramRepository")
    private readonly programRepository: IProgramRepository,
    @Inject("IFaseRepository")
    private readonly faseRepository: IFaseRepository,
    @Inject("IProofPointRepository")
    private readonly proofPointRepository: IProofPointRepository,
    @Inject("IExerciseInstanceRepository")
    private readonly exerciseInstanceRepository: IExerciseInstanceRepository,
  ) {}

  /**
   * Create a new program
   */
  @Post()
  @ApiOperation({
    summary: "Create a new educational program",
    description: "Creates a new program in draft state",
  })
  @ApiResponse({
    status: 201,
    description: "Program created successfully",
    type: ProgramResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request - validation failed" })
  async createProgram(
    @Body() createDto: CreateProgramRequestDto,
  ): Promise<ProgramResponseDto> {
    const result = await this.createProgramUseCase.execute({
      nombre: createDto.nombre,
      descripcion: createDto.descripcion,
      duracionSemanas: createDto.duracionSemanas,
      creadorId: createDto.creadorId,
      categoria: createDto.categoria,
      nivelDificultad: createDto.nivelDificultad,
      objetivosAprendizaje: createDto.objetivosAprendizaje,
      prerequisitos: createDto.prerequisitos,
      audienciaObjetivo: createDto.audienciaObjetivo,
      tags: createDto.tags,
    });

    return result.match({
      ok: async (response) => {
        // Get full program details
        const programa = await this.programRepository.findById(
          RecordId.fromString(response.programaId),
        );
        return await this.mapToResponseDto(programa!);
      },
      fail: (error) => {
        throw new BadRequestException(error.message);
      },
    });
  }

  /**
   * Get all programs
   */
  @Get()
  @ApiOperation({
    summary: "List all programs",
    description: "Get all programs, optionally filtered by status",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ["borrador", "publicado", "archivado"],
    description: "Filter by program status",
  })
  @ApiResponse({
    status: 200,
    description: "List of programs",
    type: [ProgramResponseDto],
  })
  async listPrograms(
    @Query("status") status?: string,
  ): Promise<ProgramResponseDto[]> {
    let programs;

    if (status) {
      const programStatus = ProgramStatus.create(status as any);
      programs = await this.programRepository.findByStatus(programStatus);
    } else {
      programs = await this.programRepository.findAll();
    }

    return Promise.all(programs.map((p) => this.mapToResponseDto(p)));
  }

  /**
   * Get program by ID
   */
  @Get(":id")
  @ApiOperation({
    summary: "Get program by ID",
    description: "Retrieve detailed information about a specific program",
  })
  @ApiParam({
    name: "id",
    description: "Program ID (e.g., programa:abc123)",
    example: "programa:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Program details",
    type: ProgramResponseDto,
  })
  @ApiResponse({ status: 404, description: "Program not found" })
  async getProgram(@Param("id") id: string): Promise<ProgramResponseDto> {
    const programa = await this.programRepository.findById(
      RecordId.fromString(id),
    );

    if (!programa) {
      throw new NotFoundException(`Program not found: ${id}`);
    }

    return await this.mapToResponseDto(programa);
  }

  /**
   * Update program
   */
  @Put(":id")
  @ApiOperation({
    summary: "Update program",
    description: "Update program information (only for draft programs)",
  })
  @ApiParam({
    name: "id",
    description: "Program ID",
    example: "programa:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Program updated successfully",
    type: ProgramResponseDto,
  })
  @ApiResponse({ status: 404, description: "Program not found" })
  @ApiResponse({
    status: 400,
    description: "Cannot edit published program",
  })
  async updateProgram(
    @Param("id") id: string,
    @Body() updateDto: UpdateProgramRequestDto,
  ): Promise<ProgramResponseDto> {
    const programa = await this.programRepository.findById(
      RecordId.fromString(id),
    );

    if (!programa) {
      throw new NotFoundException(`Program not found: ${id}`);
    }

    // Update program info
    if (
      updateDto.nombre ||
      updateDto.descripcion ||
      updateDto.duracionSemanas
    ) {
      try {
        programa.updateInfo(
          updateDto.nombre,
          updateDto.descripcion,
          updateDto.duracionSemanas,
        );
      } catch (error) {
        throw new BadRequestException((error as Error).message);
      }
    }

    // Update metadata
    if (
      updateDto.categoria ||
      updateDto.nivelDificultad ||
      updateDto.objetivosAprendizaje ||
      updateDto.prerequisitos ||
      updateDto.audienciaObjetivo ||
      updateDto.tags
    ) {
      try {
        programa.updateMetadata({
          categoria: updateDto.categoria,
          nivelDificultad: updateDto.nivelDificultad,
          objetivosAprendizaje: updateDto.objetivosAprendizaje,
          prerequisitos: updateDto.prerequisitos,
          audienciaObjetivo: updateDto.audienciaObjetivo,
          tags: updateDto.tags,
        });
      } catch (error) {
        throw new BadRequestException((error as Error).message);
      }
    }

    const savedPrograma = await this.programRepository.save(programa);
    return await this.mapToResponseDto(savedPrograma);
  }

  /**
   * Publish program
   */
  @Post(":id/publish")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Publish program",
    description: "Makes program available for creating cohorts",
  })
  @ApiParam({
    name: "id",
    description: "Program ID",
    example: "programa:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Program published successfully",
    type: ProgramResponseDto,
  })
  @ApiResponse({ status: 404, description: "Program not found" })
  @ApiResponse({
    status: 400,
    description: "Program cannot be published",
  })
  async publishProgram(@Param("id") id: string): Promise<ProgramResponseDto> {
    const result = await this.publishProgramUseCase.execute({
      programaId: id,
    });

    return result.match({
      ok: async () => {
        const programa = await this.programRepository.findById(
          RecordId.fromString(id),
        );
        return await this.mapToResponseDto(programa!);
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
   * Archive program
   */
  @Post(":id/archive")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Archive program",
    description: "Archives a program (soft delete)",
  })
  @ApiParam({
    name: "id",
    description: "Program ID",
    example: "programa:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Program archived successfully",
    type: ProgramResponseDto,
  })
  @ApiResponse({ status: 404, description: "Program not found" })
  async archiveProgram(@Param("id") id: string): Promise<ProgramResponseDto> {
    const result = await this.archiveProgramUseCase.execute({
      programaId: id,
    });

    return result.match({
      ok: async () => {
        const programa = await this.programRepository.findById(
          RecordId.fromString(id),
        );
        return await this.mapToResponseDto(programa!);
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
   * Recommend exercise plan for program
   * Uses AI to analyze proof points and recommend exercises
   */
  @Post(":id/recommend-exercise-plan")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Generate AI-powered exercise recommendations",
    description:
      "Analyzes proof point contexts and returns exercise recommendations using AI",
  })
  @ApiParam({
    name: "id",
    description: "Program ID",
    example: "programa:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Exercise recommendations generated",
  })
  @ApiResponse({ status: 404, description: "Program not found" })
  async recommendExercisePlan(
    @Param("id") programId: string,
    @Body() body: { proofPointContexts: Record<string, any> },
  ): Promise<{ recommendations: any[] }> {
    const result = await this.recommendExercisePlanUseCase.execute({
      programId,
      proofPointContexts: body.proofPointContexts,
    });

    return result.match({
      ok: (response) => response,
      fail: (error) => {
        if (error.message.includes("not found")) {
          throw new NotFoundException(error.message);
        }
        throw new BadRequestException(error.message);
      },
    });
  }

  /**
   * Apply exercise plan to program
   * Creates exercise instances from AI recommendations
   */
  @Post(":id/apply-exercise-plan")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Apply AI-generated exercise plan",
    description: "Creates exercise instances from recommendations",
  })
  @ApiParam({
    name: "id",
    description: "Program ID",
    example: "programa:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "Exercises created successfully",
  })
  @ApiResponse({ status: 404, description: "Program not found" })
  async applyExercisePlan(
    @Param("id") programId: string,
    @Body() body: { recommendationsToApply: any[] },
  ): Promise<{ success: boolean; created: number }> {
    try {
      this.logger.log(
        `Applying ${body.recommendationsToApply.length} exercises to program ${programId}`,
      );

      let createdCount = 0;

      // Create each exercise using the AddExerciseToProofPointUseCase
      for (const recommendation of body.recommendationsToApply) {
        const result = await this.addExerciseToProofPointUseCase.execute({
          proofPointId: recommendation.proofPointId,
          templateId: recommendation.templateId,
          nombre: recommendation.nombre,
          consideraciones: recommendation.consideracionesContexto,
          configuracion: recommendation.configuracionPersonalizada,
          duracionMinutos: recommendation.duracionEstimadaMinutos,
        });

        result.match({
          ok: () => {
            createdCount++;
          },
          fail: (error) => {
            this.logger.warn(
              `Failed to create exercise "${recommendation.nombre}": ${error.message}`,
            );
            // Continue with other exercises
          },
        });
      }

      return { success: true, created: createdCount };
    } catch (error) {
      this.logger.error("Failed to apply exercise plan", error);
      throw new BadRequestException(
        `Failed to apply exercise plan: ${error.message}`,
      );
    }
  }

  /**
   * Delete program
   */
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete program",
    description: "Permanently delete a program (only drafts)",
  })
  @ApiParam({
    name: "id",
    description: "Program ID",
    example: "programa:abc123",
  })
  @ApiResponse({ status: 204, description: "Program deleted successfully" })
  @ApiResponse({ status: 404, description: "Program not found" })
  async deleteProgram(@Param("id") id: string): Promise<void> {
    const deleted = await this.programRepository.delete(
      RecordId.fromString(id),
    );

    if (!deleted) {
      throw new NotFoundException(`Program not found: ${id}`);
    }
  }

  /**
   * Helper method to map domain entity to DTO with statistics
   */
  private async mapToResponseDto(programa: any): Promise<ProgramResponseDto> {
    const programaId = programa.getId();

    // Calculate statistics
    const fases = await this.faseRepository.findByPrograma(programaId);
    const numFases = fases.length;

    // Count total proof points and exercises across all fases
    let numProofPoints = 0;
    let numEjercicios = 0;
    for (const fase of fases) {
      const proofPoints = await this.proofPointRepository.findByFase(
        fase.getId(),
      );
      numProofPoints += proofPoints.length;

      // Count exercises for each proof point
      for (const proofPoint of proofPoints) {
        const exercises = await this.exerciseInstanceRepository.findByProofPoint(
          proofPoint.getId(),
        );
        numEjercicios += exercises.length;
      }
    }

    const duracionSemanas = programa.getDuracion().toWeeks();
    const duracionTexto = `${duracionSemanas} semana${duracionSemanas !== 1 ? "s" : ""}`;

    return {
      id: programaId.toString(),
      nombre: programa.getNombre(),
      descripcion: programa.getDescripcion(),
      duracionSemanas,
      estado: programa.getEstado().getValue(),
      versionActual: programa.getVersionActual(),
      categoria: programa.getCategoria(),
      nivelDificultad: programa.getNivelDificultad(),
      imagenPortadaUrl: programa.getImagenPortadaUrl(),
      objetivosAprendizaje: programa.getObjetivosAprendizaje(),
      prerequisitos: programa.getPrerequisitos(),
      audienciaObjetivo: programa.getAudienciaObjetivo(),
      tags: programa.getTags(),
      visible: programa.isVisible(),
      creador: programa.getCreador().toString(),
      createdAt: programa.getCreatedAt().toISOString(),
      updatedAt: programa.getUpdatedAt().toISOString(),
      estadisticas: {
        fases: numFases,
        proof_points: numProofPoints,
        ejercicios: numEjercicios,
        duracion: duracionTexto,
        estudiantes: 0, // TODO: Calculate when cohort system is implemented
      },
    };
  }
}
