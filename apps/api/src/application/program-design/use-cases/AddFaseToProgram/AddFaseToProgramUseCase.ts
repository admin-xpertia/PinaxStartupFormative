import { Injectable, Logger, Inject } from '@nestjs/common';
import { ICommand } from '../../../shared/interfaces/IUseCase';
import { Result } from '../../../shared/types/Result';
import { IProgramRepository, IFaseRepository } from '../../../../domain/program-design/repositories/IProgramRepository';
import { Fase } from '../../../../domain/program-design/entities/Fase';
import { RecordId } from '../../../../domain/shared/value-objects/RecordId';

/**
 * AddFaseToProgram UseCase
 * Adds a new fase to a program
 *
 * Flow:
 * 1. Validate program exists
 * 2. Calculate orden (next available)
 * 3. Create Fase entity
 * 4. Save fase
 * 5. Return fase ID
 */

export interface AddFaseToProgramRequest {
  programaId: string;
  numeroFase?: number; // Optional, will be auto-calculated if not provided
  nombre: string;
  descripcion: string;
  objetivosAprendizaje?: string[];
  duracionSemanasEstimada: number;
}

export interface AddFaseToProgramResponse {
  faseId: string;
  nombre: string;
  numeroFase: number;
  orden: number;
}

@Injectable()
export class AddFaseToProgramUseCase
  implements ICommand<AddFaseToProgramRequest, AddFaseToProgramResponse>
{
  private readonly logger = new Logger(AddFaseToProgramUseCase.name);

  constructor(
    @Inject('IProgramRepository')
    private readonly programRepository: IProgramRepository,
    @Inject('IFaseRepository')
    private readonly faseRepository: IFaseRepository,
  ) {}

  async execute(
    request: AddFaseToProgramRequest,
  ): Promise<Result<AddFaseToProgramResponse, Error>> {
    try {
      // 1. Validate program exists
      const programaId = RecordId.fromString(request.programaId);
      const programa = await this.programRepository.findById(programaId);

      if (!programa) {
        return Result.fail(new Error(`Program not found: ${request.programaId}`));
      }

      // 2. Calculate orden and numeroFase (get existing fases)
      const existingFases = await this.faseRepository.findByPrograma(programaId);
      const maxOrden = existingFases.length > 0
        ? Math.max(...existingFases.map(f => f.getOrden()))
        : -1;
      const newOrden = maxOrden + 1;

      // Auto-calculate numeroFase if not provided
      const numeroFase = request.numeroFase !== undefined
        ? request.numeroFase
        : existingFases.length > 0
          ? Math.max(...existingFases.map(f => f.getNumeroFase())) + 1
          : 0;

      // 3. Create Fase entity
      const fase = Fase.create(
        programaId,
        numeroFase,
        request.nombre,
        request.descripcion,
        request.duracionSemanasEstimada,
        newOrden,
      );

      // 3.1. Update objetivos de aprendizaje if provided
      if (request.objetivosAprendizaje && request.objetivosAprendizaje.length > 0) {
        fase.updateObjetivosAprendizaje(request.objetivosAprendizaje);
      }

      // 4. Save fase
      const savedFase = await this.faseRepository.save(fase);

      this.logger.log(
        `Fase added to program successfully: ${savedFase.getId().toString()}`,
      );

      // 5. Return response
      return Result.ok({
        faseId: savedFase.getId().toString(),
        nombre: savedFase.getNombre(),
        numeroFase: savedFase.getNumeroFase(),
        orden: savedFase.getOrden(),
      });
    } catch (error) {
      this.logger.error('Failed to add fase to program', error);
      return Result.fail(error as Error);
    }
  }
}
