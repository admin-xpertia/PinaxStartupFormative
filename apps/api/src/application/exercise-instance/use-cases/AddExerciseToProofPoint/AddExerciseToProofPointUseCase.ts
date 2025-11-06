import { Injectable, Logger } from '@nestjs/common';
import { ICommand } from '../../../shared/interfaces/IUseCase';
import { Result } from '../../../shared/types/Result';
import { IExerciseInstanceRepository } from '../../../../domain/exercise-instance/repositories/IExerciseInstanceRepository';
import { IExerciseTemplateRepository } from '../../../../domain/exercise-catalog/repositories/IExerciseTemplateRepository';
import { IProofPointRepository } from '../../../../domain/program-design/repositories/IProgramRepository';
import { ExerciseInstance } from '../../../../domain/exercise-instance/entities/ExerciseInstance';
import { RecordId } from '../../../../domain/shared/value-objects/RecordId';
import { AddExerciseToProofPointDTO } from './AddExerciseToProofPointDTO';

/**
 * AddExerciseToProofPointUseCase
 * Adds an exercise instance to a proof point
 *
 * Flow:
 * 1. Validate template and proof point exist
 * 2. Validate template configuration
 * 3. Calculate order (append to end)
 * 4. Create ExerciseInstance
 * 5. Save and return
 */

export interface AddExerciseToProofPointResponse {
  exerciseInstanceId: string;
  nombre: string;
  orden: number;
  estadoContenido: string;
}

@Injectable()
export class AddExerciseToProofPointUseCase
  implements ICommand<AddExerciseToProofPointDTO, AddExerciseToProofPointResponse>
{
  private readonly logger = new Logger(AddExerciseToProofPointUseCase.name);

  constructor(
    private readonly exerciseInstanceRepository: IExerciseInstanceRepository,
    private readonly templateRepository: IExerciseTemplateRepository,
    private readonly proofPointRepository: IProofPointRepository,
  ) {}

  async execute(
    request: AddExerciseToProofPointDTO,
  ): Promise<Result<AddExerciseToProofPointResponse, Error>> {
    try {
      // 1. Validate template exists
      const templateId = RecordId.fromString(request.templateId);
      const template = await this.templateRepository.findById(templateId);

      if (!template) {
        return Result.fail(new Error(`Template not found: ${request.templateId}`));
      }

      if (!template.isActivo()) {
        return Result.fail(new Error('Template is not active'));
      }

      // 2. Validate proof point exists
      const proofPointId = RecordId.fromString(request.proofPointId);
      const proofPoint = await this.proofPointRepository.findById(proofPointId);

      if (!proofPoint) {
        return Result.fail(new Error(`Proof point not found: ${request.proofPointId}`));
      }

      // 3. Validate configuration against template schema
      const configValidation = template.validateConfiguration(
        request.configuracion || {},
      );

      if (!configValidation.valid) {
        return Result.fail(
          new Error(`Invalid configuration: ${configValidation.errors.join(', ')}`),
        );
      }

      // 4. Merge configuration with defaults
      const finalConfig = template.mergeConfiguration(request.configuracion || {});

      // 5. Calculate order (append to end)
      const existingInstances = await this.exerciseInstanceRepository.findByProofPoint(
        proofPointId,
      );
      const orden = existingInstances.length;

      // 6. Create ExerciseInstance domain entity
      const instance = ExerciseInstance.create(
        templateId,
        proofPointId,
        request.nombre || template.getNombre(),
        orden,
        request.duracionMinutos || 20,
        finalConfig,
        request.consideraciones,
      );

      // 7. Save to repository
      const savedInstance = await this.exerciseInstanceRepository.save(instance);

      this.logger.log(
        `Exercise added to proof point: ${savedInstance.getId().toString()}`,
      );

      // 8. Return response
      return Result.ok({
        exerciseInstanceId: savedInstance.getId().toString(),
        nombre: savedInstance.getNombre(),
        orden: savedInstance.getOrden(),
        estadoContenido: savedInstance.getEstadoContenido().getValue(),
      });
    } catch (error) {
      this.logger.error('Failed to add exercise to proof point', error);
      return Result.fail(error as Error);
    }
  }
}
