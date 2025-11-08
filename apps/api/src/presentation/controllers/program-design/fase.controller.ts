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
import { AddFaseToProgramUseCase } from '../../../application/program-design/use-cases/AddFaseToProgram/AddFaseToProgramUseCase';
import { IFaseRepository } from '../../../domain/program-design/repositories/IProgramRepository';
import { RecordId } from '../../../domain/shared/value-objects/RecordId';
import { AddFaseRequestDto, FaseResponseDto } from '../../dtos/program-design';
import { SurrealDbService } from '../../../core/database/surrealdb.service';

/**
 * FaseController
 * REST API endpoints for Fase Management
 */
@ApiTags('fases')
@Controller()
@ApiBearerAuth('JWT-auth')
export class FaseController {
  private readonly logger = new Logger(FaseController.name);

  constructor(
    private readonly addFaseUseCase: AddFaseToProgramUseCase,
    @Inject('IFaseRepository')
    private readonly faseRepository: IFaseRepository,
    private readonly db: SurrealDbService,
  ) {}

  /**
   * Add fase to program
   */
  @Post('programs/:programId/fases')
  @ApiOperation({
    summary: 'Add fase to program',
    description: 'Creates a new fase within a program',
  })
  @ApiParam({
    name: 'programId',
    description: 'Program ID',
    example: 'programa:abc123',
  })
  @ApiResponse({
    status: 201,
    description: 'Fase created successfully',
    type: FaseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Program not found' })
  async addFase(
    @Param('programId') programId: string,
    @Body() addFaseDto: AddFaseRequestDto,
  ): Promise<FaseResponseDto> {
    const result = await this.addFaseUseCase.execute({
      programaId: programId,
      numeroFase: addFaseDto.numeroFase,
      nombre: addFaseDto.nombre,
      descripcion: addFaseDto.descripcion,
      objetivosAprendizaje: addFaseDto.objetivosAprendizaje,
      duracionSemanasEstimada: addFaseDto.duracionSemanasEstimada,
    });

    return result.match({
      ok: async (response) => {
        // Return DTO directly from use case response without additional query
        return {
          id: response.faseId,
          programa: programId,
          numeroFase: response.numeroFase,
          nombre: response.nombre,
          descripcion: addFaseDto.descripcion,
          objetivosAprendizaje: addFaseDto.objetivosAprendizaje || [],
          duracionSemanasEstimada: addFaseDto.duracionSemanasEstimada,
          orden: response.orden,
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
   * List fases by program
   */
  @Get('programs/:programId/fases')
  @ApiOperation({
    summary: 'List program fases',
    description: 'Get all fases for a specific program',
  })
  @ApiParam({
    name: 'programId',
    description: 'Program ID',
    example: 'programa:abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'List of fases',
    type: [FaseResponseDto],
  })
  async listFasesByProgram(
    @Param('programId') programId: string,
  ): Promise<FaseResponseDto[]> {
    // Query database directly to get plain objects
    const query = `
      SELECT * FROM fase
      WHERE programa = type::thing($programaId)
      ORDER BY orden ASC
    `;

    const result = await this.db.query(query, {
      programaId: programId,
    });

    // Extract first result set (SurrealDB returns array of result sets)
    const fases = Array.isArray(result[0]) ? result[0] : [];

    // Map plain objects to DTOs directly
    return fases.map((f: any) => ({
      id: f.id,
      programa: f.programa,
      numeroFase: f.numero_fase,
      nombre: f.nombre,
      descripcion: f.descripcion,
      objetivosAprendizaje: f.objetivos_aprendizaje || [],
      duracionSemanasEstimada: f.duracion_semanas_estimada,
      orden: f.orden,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    }));
  }

  /**
   * Get fase by ID
   */
  @Get('fases/:id')
  @ApiOperation({
    summary: 'Get fase by ID',
    description: 'Retrieve detailed information about a specific fase',
  })
  @ApiParam({
    name: 'id',
    description: 'Fase ID',
    example: 'fase:abc123',
  })
  @ApiResponse({
    status: 200,
    description: 'Fase details',
    type: FaseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Fase not found' })
  async getFase(@Param('id') id: string): Promise<FaseResponseDto> {
    const fase = await this.faseRepository.findById(RecordId.fromString(id));

    if (!fase) {
      throw new NotFoundException(`Fase not found: ${id}`);
    }

    return this.mapToResponseDto(fase);
  }

  /**
   * Delete fase
   */
  @Delete('fases/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete fase',
    description: 'Permanently delete a fase',
  })
  @ApiParam({
    name: 'id',
    description: 'Fase ID',
    example: 'fase:abc123',
  })
  @ApiResponse({ status: 204, description: 'Fase deleted successfully' })
  @ApiResponse({ status: 404, description: 'Fase not found' })
  async deleteFase(@Param('id') id: string): Promise<void> {
    const deleted = await this.faseRepository.delete(RecordId.fromString(id));

    if (!deleted) {
      throw new NotFoundException(`Fase not found: ${id}`);
    }
  }

  /**
   * Helper method to map domain entity to DTO
   */
  private mapToResponseDto(fase: any): FaseResponseDto {
    return {
      id: fase.getId().toString(),
      programa: fase.getPrograma().toString(),
      numeroFase: fase.getNumeroFase(),
      nombre: fase.getNombre(),
      descripcion: fase.getDescripcion(),
      objetivosAprendizaje: fase.getObjetivosAprendizaje(),
      duracionSemanasEstimada: fase.getDuracion().toWeeks(),
      orden: fase.getOrden(),
      createdAt: fase.getCreatedAt().toISOString(),
      updatedAt: fase.getUpdatedAt().toISOString(),
    };
  }
}
