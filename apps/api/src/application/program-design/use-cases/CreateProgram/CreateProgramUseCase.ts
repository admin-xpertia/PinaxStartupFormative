import { Injectable, Logger } from '@nestjs/common';
import { ICommand } from '../../../shared/interfaces/IUseCase';
import { Result } from '../../../shared/types/Result';
import { IProgramRepository } from '../../../../domain/program-design/repositories/IProgramRepository';
import { Programa } from '../../../../domain/program-design/entities/Programa';
import { RecordId } from '../../../../domain/shared/value-objects/RecordId';
import { CreateProgramDTO } from './CreateProgramDTO';

/**
 * CreateProgramUseCase
 * Creates a new educational program
 *
 * Flow:
 * 1. Validate request
 * 2. Create Programa domain entity
 * 3. Save to repository
 * 4. Return program ID
 */

export interface CreateProgramResponse {
  programaId: string;
  nombre: string;
  estado: string;
}

@Injectable()
export class CreateProgramUseCase
  implements ICommand<CreateProgramDTO, CreateProgramResponse>
{
  private readonly logger = new Logger(CreateProgramUseCase.name);

  constructor(private readonly programRepository: IProgramRepository) {}

  async execute(
    request: CreateProgramDTO,
  ): Promise<Result<CreateProgramResponse, Error>> {
    try {
      // 1. Validate request
      const validation = this.validate(request);
      if (!validation.valid) {
        return Result.fail(new Error(validation.errors.join(', ')));
      }

      // 2. Create domain entity
      const creadorId = RecordId.fromString(request.creadorId);
      const programa = Programa.create(
        request.nombre,
        request.descripcion,
        request.duracionSemanas,
        creadorId,
      );

      // Add optional metadata if provided
      if (request.categoria || request.nivelDificultad || request.tags) {
        programa.updateMetadata({
          categoria: request.categoria,
          nivelDificultad: request.nivelDificultad,
          objetivosAprendizaje: request.objetivosAprendizaje,
          prerequisitos: request.prerequisitos,
          audienciaObjetivo: request.audienciaObjetivo,
          tags: request.tags,
        });
      }

      // 3. Save to repository
      const savedPrograma = await this.programRepository.save(programa);

      this.logger.log(
        `Program created successfully: ${savedPrograma.getId().toString()}`,
      );

      // 4. Return response
      return Result.ok({
        programaId: savedPrograma.getId().toString(),
        nombre: savedPrograma.getNombre(),
        estado: savedPrograma.getEstado().getValue(),
      });
    } catch (error) {
      this.logger.error('Failed to create program', error);
      return Result.fail(error as Error);
    }
  }

  private validate(request: CreateProgramDTO): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.nombre || request.nombre.trim().length < 3) {
      errors.push('Program name must be at least 3 characters');
    }

    if (!request.descripcion || request.descripcion.trim().length === 0) {
      errors.push('Program description is required');
    }

    if (!request.duracionSemanas || request.duracionSemanas <= 0) {
      errors.push('Program duration must be positive');
    }

    if (!request.creadorId) {
      errors.push('Creator ID is required');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
