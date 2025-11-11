import { Injectable, Logger, Inject } from "@nestjs/common";
import { ICommand } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import { IProgramRepository } from "../../../../domain/program-design/repositories/IProgramRepository";
import { RecordId } from "../../../../domain/shared/value-objects/RecordId";

/**
 * PublishProgramUseCase
 * Publishes a program making it available for cohorts
 *
 * Flow:
 * 1. Find program by ID
 * 2. Validate program can be published
 * 3. Call domain method publish()
 * 4. Save updated program
 * 5. Return success
 */

export interface PublishProgramRequest {
  programaId: string;
}

export interface PublishProgramResponse {
  programaId: string;
  nombre: string;
  estado: string;
}

@Injectable()
export class PublishProgramUseCase
  implements ICommand<PublishProgramRequest, PublishProgramResponse>
{
  private readonly logger = new Logger(PublishProgramUseCase.name);

  constructor(
    @Inject("IProgramRepository")
    private readonly programRepository: IProgramRepository,
  ) {}

  async execute(
    request: PublishProgramRequest,
  ): Promise<Result<PublishProgramResponse, Error>> {
    try {
      // 1. Find program
      const programaId = RecordId.fromString(request.programaId);
      const programa = await this.programRepository.findById(programaId);

      if (!programa) {
        return Result.fail(
          new Error(`Program not found: ${request.programaId}`),
        );
      }

      // 2. Publish program (domain logic validates if can publish)
      try {
        programa.publish();
      } catch (domainError) {
        return Result.fail(domainError as Error);
      }

      // 3. Save updated program
      const savedPrograma = await this.programRepository.save(programa);

      this.logger.log(
        `Program published successfully: ${savedPrograma.getId().toString()}`,
      );

      // 4. Return response
      return Result.ok({
        programaId: savedPrograma.getId().toString(),
        nombre: savedPrograma.getNombre(),
        estado: savedPrograma.getEstado().getValue(),
      });
    } catch (error) {
      this.logger.error("Failed to publish program", error);
      return Result.fail(error as Error);
    }
  }
}
