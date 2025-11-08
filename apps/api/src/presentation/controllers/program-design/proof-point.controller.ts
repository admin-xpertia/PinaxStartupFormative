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
import { AddProofPointToFaseUseCase } from '../../../application/program-design/use-cases/AddProofPointToFase/AddProofPointToFaseUseCase';
import { IProofPointRepository } from '../../../domain/program-design/repositories/IProgramRepository';
import { RecordId } from '../../../domain/shared/value-objects/RecordId';
import { AddProofPointRequestDto, ProofPointResponseDto } from '../../dtos/program-design';
import { SurrealDbService } from '../../../core/database/surrealdb.service';

/**
 * ProofPointController
 * REST API endpoints for ProofPoint Management
 */
@ApiTags('proof-points')
@Controller()
@ApiBearerAuth('JWT-auth')
export class ProofPointController {
  private readonly logger = new Logger(ProofPointController.name);

  constructor(
    private readonly addProofPointUseCase: AddProofPointToFaseUseCase,
    @Inject('IProofPointRepository')
    private readonly proofPointRepository: IProofPointRepository,
    private readonly db: SurrealDbService,
  ) {}

  /**
   * Add proof point to fase
   */
  @Post('fases/:faseId/proof-points')
  @ApiOperation({
    summary: 'Add proof point to fase',
    description: 'Creates a new proof point within a fase',
  })
  @ApiParam({
    name: 'faseId',
    description: 'Fase ID',
    example: 'fase:abc123',
  })
  @ApiResponse({
    status: 201,
    description: 'ProofPoint created successfully',
    type: ProofPointResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fase not found' })
  @ApiResponse({ status: 400, description: 'Slug already in use' })
  async addProofPoint(
    @Param('faseId') faseId: string,
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
          documentacionContexto: addProofPointDto.documentacionContexto || '',
          prerequisitos: addProofPointDto.prerequisitos || [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
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
   * List proof points by fase
   */
  @Get('fases/:faseId/proof-points')
  @ApiOperation({
    summary: 'List fase proof points',
    description: 'Get all proof points for a specific fase',
  })
  @ApiParam({
    name: 'faseId',
    description: 'Fase ID',
    example: 'fase:abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'List of proof points',
    type: [ProofPointResponseDto],
  })
  async listProofPointsByFase(
    @Param('faseId') faseId: string,
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

    // Extract first result set (SurrealDB returns array of result sets)
    const proofPoints = Array.isArray(result[0]) ? result[0] : [];

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
      documentacionContexto: pp.documentacion_contexto || '',
      prerequisitos: pp.prerequisitos || [],
      createdAt: pp.created_at,
      updatedAt: pp.updated_at,
    }));
  }

  /**
   * Get proof point by ID
   */
  @Get('proof-points/:id')
  @ApiOperation({
    summary: 'Get proof point by ID',
    description: 'Retrieve detailed information about a specific proof point',
  })
  @ApiParam({
    name: 'id',
    description: 'ProofPoint ID',
    example: 'proof_point:abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'ProofPoint details',
    type: ProofPointResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ProofPoint not found' })
  async getProofPoint(@Param('id') id: string): Promise<ProofPointResponseDto> {
    const proofPoint = await this.proofPointRepository.findById(RecordId.fromString(id));

    if (!proofPoint) {
      throw new NotFoundException(`ProofPoint not found: ${id}`);
    }

    return this.mapToResponseDto(proofPoint);
  }

  /**
   * Get proof point by slug
   */
  @Get('proof-points/slug/:slug')
  @ApiOperation({
    summary: 'Get proof point by slug',
    description: 'Retrieve proof point by its URL slug',
  })
  @ApiParam({
    name: 'slug',
    description: 'ProofPoint slug',
    example: 'crear-mi-primera-variable',
  })
  @ApiResponse({
    status: 200,
    description: 'ProofPoint details',
    type: ProofPointResponseDto,
  })
  @ApiResponse({ status: 404, description: 'ProofPoint not found' })
  async getProofPointBySlug(@Param('slug') slug: string): Promise<ProofPointResponseDto> {
    const proofPoint = await this.proofPointRepository.findBySlug(slug);

    if (!proofPoint) {
      throw new NotFoundException(`ProofPoint not found with slug: ${slug}`);
    }

    return this.mapToResponseDto(proofPoint);
  }

  /**
   * Delete proof point
   */
  @Delete('proof-points/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete proof point',
    description: 'Permanently delete a proof point',
  })
  @ApiParam({
    name: 'id',
    description: 'ProofPoint ID',
    example: 'proof_point:abc123',
  })
  @ApiResponse({ status: 204, description: 'ProofPoint deleted successfully' })
  @ApiResponse({ status: 404, description: 'ProofPoint not found' })
  async deleteProofPoint(@Param('id') id: string): Promise<void> {
    const deleted = await this.proofPointRepository.delete(RecordId.fromString(id));

    if (!deleted) {
      throw new NotFoundException(`ProofPoint not found: ${id}`);
    }
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
      prerequisitos: proofPoint.getPrerequisitos().map(p => p.toString()),
      createdAt: proofPoint.getCreatedAt().toISOString(),
      updatedAt: proofPoint.getUpdatedAt().toISOString(),
    };
  }
}
