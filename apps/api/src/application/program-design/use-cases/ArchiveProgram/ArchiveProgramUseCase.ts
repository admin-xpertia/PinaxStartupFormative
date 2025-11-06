import { Injectable, Logger, Inject } from '@nestjs/common';
import { ICommand } from '../../../shared/interfaces/IUseCase';
import { Result } from '../../../shared/types/Result';
import { IProgramRepository } from '../../../../domain/program-design/repositories/IProgramRepository';
import { RecordId } from '../../../../domain/shared/value-objects/RecordId';

/**
 * ArchiveProgramUseCase
 * Archives a program (soft delete)
 *
 * Flow:
 * 1. Find program by ID
 * 2. Call domain method archive()
 * 3. Save updated program
 * 4. Return success
 */

export interface ArchiveProgramRequest {
  programaId: string;
}

export interface ArchiveProgramResponse {
  programaId: string;
  nombre: string;
  estado: string;
}

@Injectable()
export class ArchiveProgramUseCase
  implements ICommand<ArchiveProgramRequest, ArchiveProgramResponse>
{
  private readonly logger = new Logger(ArchiveProgramUseCase.name);

  constructor(
    @Inject('IProgramRepository')
    private readonly programRepository: IProgramRepository,
  ) {}

  async execute(
    request: ArchiveProgramRequest,
  ): Promise<Result<ArchiveProgramResponse, Error>> {
    try {
      // 1. Find program
      const programaId = RecordId.fromString(request.programaId);
      const programa = await this.programRepository.findById(programaId);

      if (!programa) {
        return Result.fail(new Error(`Program not found: ${request.programaId}`));
      }

      // 2. Archive program (domain logic)
      programa.archive();

      // 3. Save updated program
      const savedPrograma = await this.programRepository.save(programa);

      this.logger.log(
        `Program archived successfully: ${savedPrograma.getId().toString()}`,
      );

      // 4. Return response
      return Result.ok({
        programaId: savedPrograma.getId().toString(),
        nombre: savedPrograma.getNombre(),
        estado: savedPrograma.getEstado().getValue(),
      });
    } catch (error) {
      this.logger.error('Failed to archive program', error);
      return Result.fail(error as Error);
    }
  }
}
