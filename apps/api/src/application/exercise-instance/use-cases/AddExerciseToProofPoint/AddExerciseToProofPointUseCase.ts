import { Injectable, Logger, Inject } from "@nestjs/common";
import { ICommand } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import { IExerciseInstanceRepository } from "../../../../domain/exercise-instance/repositories/IExerciseInstanceRepository";
import { IExerciseTemplateRepository } from "../../../../domain/exercise-catalog/repositories/IExerciseTemplateRepository";
import { IProofPointRepository } from "../../../../domain/program-design/repositories/IProgramRepository";
import { ExerciseInstance } from "../../../../domain/exercise-instance/entities/ExerciseInstance";
import { RecordId } from "../../../../domain/shared/value-objects/RecordId";
import { AddExerciseToProofPointDTO } from "./AddExerciseToProofPointDTO";
import { SurrealDbService } from "../../../../core/database/surrealdb.service";

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
  implements
    ICommand<AddExerciseToProofPointDTO, AddExerciseToProofPointResponse>
{
  private readonly logger = new Logger(AddExerciseToProofPointUseCase.name);

  constructor(
    @Inject("IExerciseInstanceRepository")
    private readonly exerciseInstanceRepository: IExerciseInstanceRepository,
    @Inject("IExerciseTemplateRepository")
    private readonly templateRepository: IExerciseTemplateRepository,
    @Inject("IProofPointRepository")
    private readonly proofPointRepository: IProofPointRepository,
    private readonly db: SurrealDbService,
  ) {}

  async execute(
    request: AddExerciseToProofPointDTO,
  ): Promise<Result<AddExerciseToProofPointResponse, Error>> {
    try {
      // 1. Validate template exists - Query directly from database
      const templateResult = await this.db.query(
        "SELECT * FROM type::thing($id)",
        { id: request.templateId },
      );

      let template: any;
      if (Array.isArray(templateResult) && templateResult.length > 0) {
        if (Array.isArray(templateResult[0]) && templateResult[0].length > 0) {
          template = templateResult[0][0];
        } else if (!Array.isArray(templateResult[0])) {
          template = templateResult[0];
        }
      }

      if (!template) {
        return Result.fail(
          new Error(`Template not found: ${request.templateId}`),
        );
      }

      if (!template.activo) {
        return Result.fail(new Error("Template is not active"));
      }

      // 2. Validate proof point exists
      const proofPointId = RecordId.fromString(request.proofPointId);
      const proofPoint = await this.proofPointRepository.findById(proofPointId);

      if (!proofPoint) {
        return Result.fail(
          new Error(`Proof point not found: ${request.proofPointId}`),
        );
      }

      // 3. Merge configuration with template defaults (skip validation)
      const finalConfig = {
        ...(template.configuracion_default || {}),
        ...(request.configuracion || {}),
      };

      // 4. Calculate order (append to end)
      const existingInstances =
        await this.exerciseInstanceRepository.findByProofPoint(proofPointId);
      const orden = existingInstances.length;

      // 5. Create ExerciseInstance domain entity
      const templateId = RecordId.fromString(request.templateId);
      const safeNombre = sanitizeExerciseName(
        request.nombre || template.nombre,
      );
      const instance = ExerciseInstance.create(
        templateId,
        proofPointId,
        safeNombre,
        orden,
        request.duracionMinutos || 20,
        finalConfig,
        request.consideraciones,
      );

      // 6. Save to repository
      const savedInstance =
        await this.exerciseInstanceRepository.save(instance);

      this.logger.log(
        `Exercise added to proof point: ${savedInstance.getId().toString()}`,
      );

      // 7. Return response
      return Result.ok({
        exerciseInstanceId: savedInstance.getId().toString(),
        nombre: savedInstance.getNombre(),
        orden: savedInstance.getOrden(),
        estadoContenido: savedInstance.getEstadoContenido().getValue(),
      });
    } catch (error) {
      this.logger.error("Failed to add exercise to proof point", error);
      return Result.fail(error as Error);
    }
  }
}

const sanitizeExerciseName = (value?: string): string => {
  if (!value) {
    return "Ejercicio sin nombre";
  }

  const normalized = value.toString();
  // Replace colon with dash to avoid SurrealDB interpreting it as type::thing identifier
  return normalized.replace(/:/g, " - ").replace(/\s+/g, " ").trim();
};
