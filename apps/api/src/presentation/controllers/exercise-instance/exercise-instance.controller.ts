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
import { AddExerciseToProofPointUseCase } from '../../../application/exercise-instance/use-cases/AddExerciseToProofPoint/AddExerciseToProofPointUseCase';
import { IExerciseInstanceRepository } from '../../../domain/exercise-instance/repositories/IExerciseInstanceRepository';
import { RecordId } from '../../../domain/shared/value-objects/RecordId';
import { AddExerciseToProofPointRequestDto, ExerciseInstanceResponseDto } from '../../dtos/exercise-instance';

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
    @Inject('IExerciseInstanceRepository')
    private readonly exerciseInstanceRepository: IExerciseInstanceRepository,
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
    const result = await this.addExerciseUseCase.execute({
      proofPointId,
      templateId: addExerciseDto.templateId,
      nombre: addExerciseDto.nombre,
      duracionMinutos: addExerciseDto.duracionEstimadaMinutos,
      consideraciones: addExerciseDto.consideracionesContexto,
      configuracion: addExerciseDto.configuracionPersonalizada,
    });

    return result.match({
      ok: async (response) => {
        const exercise = await this.exerciseInstanceRepository.findById(
          RecordId.fromString(response.exerciseInstanceId),
        );
        return this.mapToResponseDto(exercise!);
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
    const exercises = await this.exerciseInstanceRepository.findByProofPoint(
      RecordId.fromString(proofPointId),
    );
    return exercises.map(ex => this.mapToResponseDto(ex));
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
    const exercise = await this.exerciseInstanceRepository.findById(RecordId.fromString(id));

    if (!exercise) {
      throw new NotFoundException(`Exercise not found: ${id}`);
    }

    return this.mapToResponseDto(exercise);
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
    const deleted = await this.exerciseInstanceRepository.delete(RecordId.fromString(id));

    if (!deleted) {
      throw new NotFoundException(`Exercise not found: ${id}`);
    }
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
