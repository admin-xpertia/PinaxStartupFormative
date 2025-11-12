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
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AddProofPointToFaseUseCase } from "../../../application/program-design/use-cases/AddProofPointToFase/AddProofPointToFaseUseCase";
import { IProofPointRepository } from "../../../domain/program-design/repositories/IProgramRepository";
import { RecordId } from "../../../domain/shared/value-objects/RecordId";
import {
  AddProofPointRequestDto,
  ProofPointResponseDto,
  ProofPointDetailsDto,
} from "../../dtos/program-design";
import { SurrealDbService } from "../../../core/database/surrealdb.service";
import { Public } from "../../../core/decorators";

/**
 * ProofPointController
 * REST API endpoints for ProofPoint Management
 */
@ApiTags("proof-points")
@Controller()
@ApiBearerAuth("JWT-auth")
export class ProofPointController {
  private readonly logger = new Logger(ProofPointController.name);

  constructor(
    private readonly addProofPointUseCase: AddProofPointToFaseUseCase,
    @Inject("IProofPointRepository")
    private readonly proofPointRepository: IProofPointRepository,
    private readonly db: SurrealDbService,
  ) {}

  /**
   * Add proof point to fase
   */
  @Post("fases/:faseId/proof-points")
  @ApiOperation({
    summary: "Add proof point to fase",
    description: "Creates a new proof point within a fase",
  })
  @ApiParam({
    name: "faseId",
    description: "Fase ID",
    example: "fase:abc123",
  })
  @ApiResponse({
    status: 201,
    description: "ProofPoint created successfully",
    type: ProofPointResponseDto,
  })
  @ApiResponse({ status: 404, description: "Fase not found" })
  @ApiResponse({ status: 400, description: "Slug already in use" })
  async addProofPoint(
    @Param("faseId") faseId: string,
    @Body() addProofPointDto: AddProofPointRequestDto,
  ): Promise<ProofPointResponseDto> {
    const result = await this.addProofPointUseCase.execute({
      faseId: faseId,
      nombre: addProofPointDto.nombre,
      slug: addProofPointDto.slug,
      descripcion: addProofPointDto.descripcion,
      preguntaCentral: addProofPointDto.preguntaCentral,
      duracionEstimadaHoras: addProofPointDto.duracionEstimadaHoras,
      tipoEntregableFinal: addProofPointDto.tipoEntregableFinal,
      documentacionContexto: addProofPointDto.documentacionContexto,
      prerequisitos: addProofPointDto.prerequisitos,
    });

    return result.match({
      ok: async (response) => {
        // Return DTO directly from use case response without additional query
        return {
          id: response.proofPointId,
          fase: faseId,
          nombre: response.nombre,
          slug: response.slug,
          descripcion: addProofPointDto.descripcion,
          preguntaCentral: addProofPointDto.preguntaCentral,
          ordenEnFase: response.ordenEnFase,
          duracionEstimadaHoras: addProofPointDto.duracionEstimadaHoras,
          tipoEntregableFinal: addProofPointDto.tipoEntregableFinal,
          documentacionContexto: addProofPointDto.documentacionContexto || "",
          prerequisitos: addProofPointDto.prerequisitos || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
   * List proof points by fase
   */
  @Get("fases/:faseId/proof-points")
  @ApiOperation({
    summary: "List fase proof points",
    description: "Get all proof points for a specific fase",
  })
  @ApiParam({
    name: "faseId",
    description: "Fase ID",
    example: "fase:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "List of proof points",
    type: [ProofPointResponseDto],
  })
  async listProofPointsByFase(
    @Param("faseId") faseId: string,
  ): Promise<ProofPointResponseDto[]> {
    // Query database directly to get plain objects
    const query = `
      SELECT * FROM proof_point
      WHERE fase = type::thing($faseId)
      ORDER BY orden_en_fase ASC
    `;

    const result = await this.db.query(query, {
      faseId: faseId,
    });

    // Extract proof points - SurrealDB might return [[pps]] or [pps] depending on query
    let proofPoints: any[];
    if (Array.isArray(result) && result.length > 0) {
      // If first element is an array, it's nested [[pps]]
      if (Array.isArray(result[0])) {
        proofPoints = result[0];
      } else {
        // Otherwise it's already flat [pps]
        proofPoints = result;
      }
    } else {
      proofPoints = [];
    }

    // Map plain objects to DTOs directly
    return proofPoints.map((pp: any) => ({
      id: pp.id,
      fase: pp.fase,
      nombre: pp.nombre,
      slug: pp.slug,
      descripcion: pp.descripcion,
      preguntaCentral: pp.pregunta_central,
      ordenEnFase: pp.orden_en_fase,
      duracionEstimadaHoras: pp.duracion_estimada_horas,
      tipoEntregableFinal: pp.tipo_entregable_final,
      documentacionContexto: pp.documentacion_contexto || "",
      prerequisitos: pp.prerequisitos || [],
      createdAt: pp.created_at,
      updatedAt: pp.updated_at,
    }));
  }

  /**
   * Get proof point by ID
   */
  @Get("proof-points/:id")
  @ApiOperation({
    summary: "Get proof point by ID",
    description: "Retrieve detailed information about a specific proof point",
  })
  @ApiParam({
    name: "id",
    description: "ProofPoint ID",
    example: "proof_point:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "ProofPoint details",
    type: ProofPointResponseDto,
  })
  @ApiResponse({ status: 404, description: "ProofPoint not found" })
  async getProofPoint(@Param("id") id: string): Promise<ProofPointResponseDto> {
    // Decode URL-encoded characters
    const decodedId = decodeURIComponent(id);

    // Query database directly
    const result = await this.db.query("SELECT * FROM type::thing($id)", {
      id: decodedId,
    });

    // Extract proof point
    let proofPoint: any;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        proofPoint = result[0][0];
      } else if (!Array.isArray(result[0])) {
        proofPoint = result[0];
      }
    }

    if (!proofPoint) {
      throw new NotFoundException(`ProofPoint not found: ${id}`);
    }

    return {
      id: proofPoint.id,
      fase: proofPoint.fase,
      nombre: proofPoint.nombre,
      slug: proofPoint.slug,
      descripcion: proofPoint.descripcion,
      preguntaCentral: proofPoint.pregunta_central,
      ordenEnFase: proofPoint.orden_en_fase,
      duracionEstimadaHoras: proofPoint.duracion_estimada_horas,
      tipoEntregableFinal: proofPoint.tipo_entregable_final,
      documentacionContexto: proofPoint.documentacion_contexto || "",
      prerequisitos: proofPoint.prerequisitos || [],
      createdAt: proofPoint.created_at,
      updatedAt: proofPoint.updated_at,
    };
  }

  /**
   * Get proof point by slug
   */
  @Get("proof-points/slug/:slug")
  @ApiOperation({
    summary: "Get proof point by slug",
    description: "Retrieve proof point by its URL slug",
  })
  @ApiParam({
    name: "slug",
    description: "ProofPoint slug",
    example: "crear-mi-primera-variable",
  })
  @ApiResponse({
    status: 200,
    description: "ProofPoint details",
    type: ProofPointResponseDto,
  })
  @ApiResponse({ status: 404, description: "ProofPoint not found" })
  async getProofPointBySlug(
    @Param("slug") slug: string,
  ): Promise<ProofPointResponseDto> {
    const proofPoint = await this.proofPointRepository.findBySlug(slug);

    if (!proofPoint) {
      throw new NotFoundException(`ProofPoint not found with slug: ${slug}`);
    }

    return this.mapToResponseDto(proofPoint);
  }

  /**
   * Update proof point
   */
  @Put("proof-points/:id")
  @ApiOperation({
    summary: "Update proof point",
    description: "Update an existing proof point",
  })
  @ApiParam({
    name: "id",
    description: "ProofPoint ID",
    example: "proof_point:abc123",
  })
  @ApiResponse({
    status: 200,
    description: "ProofPoint updated successfully",
    type: ProofPointResponseDto,
  })
  @ApiResponse({ status: 404, description: "ProofPoint not found" })
  async updateProofPoint(
    @Param("id") id: string,
    @Body() updateDto: AddProofPointRequestDto,
  ): Promise<ProofPointResponseDto> {
    // Decode URL-encoded characters
    const decodedId = decodeURIComponent(id);

    // Update using direct database query
    const query = `
      UPDATE type::thing($id) SET
        nombre = $nombre,
        descripcion = $descripcion,
        pregunta_central = $preguntaCentral,
        duracion_estimada_horas = $duracionEstimadaHoras,
        tipo_entregable_final = $tipoEntregableFinal,
        documentacion_contexto = $documentacionContexto,
        prerequisitos = $prerequisitos,
        updated_at = time::now()
      RETURN AFTER
    `;

    const result = await this.db.query(query, {
      id: decodedId,
      nombre: updateDto.nombre,
      descripcion: updateDto.descripcion,
      preguntaCentral: updateDto.preguntaCentral,
      duracionEstimadaHoras: updateDto.duracionEstimadaHoras,
      tipoEntregableFinal: updateDto.tipoEntregableFinal || null,
      documentacionContexto: updateDto.documentacionContexto || "",
      prerequisitos: updateDto.prerequisitos || [],
    });

    // Extract updated proof point
    let updated: any;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        updated = result[0][0];
      } else if (!Array.isArray(result[0])) {
        updated = result[0];
      }
    }

    if (!updated) {
      throw new NotFoundException(`ProofPoint not found: ${id}`);
    }

    return {
      id: updated.id,
      fase: updated.fase,
      nombre: updated.nombre,
      slug: updated.slug,
      descripcion: updated.descripcion,
      preguntaCentral: updated.pregunta_central,
      ordenEnFase: updated.orden_en_fase,
      duracionEstimadaHoras: updated.duracion_estimada_horas,
      tipoEntregableFinal: updated.tipo_entregable_final,
      documentacionContexto: updated.documentacion_contexto || "",
      prerequisitos: updated.prerequisitos || [],
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }

  /**
   * Delete proof point
   */
  @Delete("proof-points/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete proof point",
    description: "Permanently delete a proof point",
  })
  @ApiParam({
    name: "id",
    description: "ProofPoint ID",
    example: "proof_point:abc123",
  })
  @ApiResponse({ status: 204, description: "ProofPoint deleted successfully" })
  @ApiResponse({ status: 404, description: "ProofPoint not found" })
  async deleteProofPoint(@Param("id") id: string): Promise<void> {
    const deleted = await this.proofPointRepository.delete(
      RecordId.fromString(id),
    );

    if (!deleted) {
      throw new NotFoundException(`ProofPoint not found: ${id}`);
    }
  }

  /**
   * Get proof point details for student (Public endpoint)
   */
  @Public()
  @Get("student/proof-points/:id")
  @ApiOperation({
    summary: "Get proof point details for student",
    description:
      "Get complete proof point information including phase and program details",
  })
  @ApiParam({
    name: "id",
    description: "ProofPoint ID",
    example: "proof_point:⟨1762784185921_0⟩",
  })
  @ApiResponse({
    status: 200,
    description: "Proof point details",
    type: ProofPointDetailsDto,
  })
  @ApiResponse({ status: 404, description: "ProofPoint not found" })
  async getProofPointDetails(
    @Param("id") id: string,
  ): Promise<ProofPointDetailsDto> {
    const decodedId = decodeURIComponent(id);

    // Fetch proof point, fase, and programa sequentially to avoid unsupported aliases
    const proofPointResult = await this.db.query(
      "SELECT * FROM type::thing($id)",
      { id: decodedId },
    );
    const proofPoint = this.extractSingleRecord(proofPointResult);

    if (!proofPoint) {
      throw new NotFoundException(`ProofPoint not found: ${id}`);
    }

    let faseInfo: any;
    if (proofPoint.fase) {
      const faseResult = await this.db.query(
        "SELECT * FROM type::thing($faseId)",
        { faseId: proofPoint.fase },
      );
      faseInfo = this.extractSingleRecord(faseResult);
    }

    let programaInfo: any;
    if (faseInfo?.programa) {
      const programaResult = await this.db.query(
        "SELECT * FROM type::thing($programaId)",
        { programaId: faseInfo.programa },
      );
      programaInfo = this.extractSingleRecord(programaResult);
    }

    // Map to DTO
    return {
      id: proofPoint.id,
      nombre: proofPoint.nombre,
      slug: proofPoint.slug,
      descripcion: proofPoint.descripcion,
      preguntaCentral: proofPoint.pregunta_central,
      ordenEnFase: proofPoint.orden_en_fase,
      duracionEstimadaHoras: proofPoint.duracion_estimada_horas,
      tipoEntregableFinal: proofPoint.tipo_entregable_final,
      documentacionContexto: proofPoint.documentacion_contexto || "",
      prerequisitos: proofPoint.prerequisitos || [],
      faseId: proofPoint.fase,
      faseNombre: faseInfo?.nombre || "",
      faseDescripcion: faseInfo?.descripcion,
      faseNumero: faseInfo?.numero_fase ?? faseInfo?.orden ?? 0,
      programaId: programaInfo?.id || "",
      programaNombre: programaInfo?.nombre || "",
      createdAt: proofPoint.created_at,
      updatedAt: proofPoint.updated_at,
    };
  }

  /**
   * Helper method to map domain entity to DTO
   */
  private mapToResponseDto(proofPoint: any): ProofPointResponseDto {
    return {
      id: proofPoint.getId().toString(),
      fase: proofPoint.getFase().toString(),
      nombre: proofPoint.getNombre(),
      slug: proofPoint.getSlug().getValue(),
      descripcion: proofPoint.getDescripcion(),
      preguntaCentral: proofPoint.getPreguntaCentral(),
      ordenEnFase: proofPoint.getOrdenEnFase(),
      duracionEstimadaHoras: proofPoint.getDuracion().toHours(),
      tipoEntregableFinal: proofPoint.getTipoEntregableFinal(),
      documentacionContexto: proofPoint.getDocumentacionContexto(),
      prerequisitos: proofPoint.getPrerequisitos().map((p) => p.toString()),
      createdAt: proofPoint.getCreatedAt().toISOString(),
      updatedAt: proofPoint.getUpdatedAt().toISOString(),
    };
  }

  /**
   * Normalizes SurrealDB query responses that may return nested arrays.
   */
  private extractSingleRecord(result: any): any | undefined {
    if (!Array.isArray(result) || result.length === 0) {
      return undefined;
    }

    if (Array.isArray(result[0])) {
      return result[0][0];
    }

    return result[0];
  }
}
