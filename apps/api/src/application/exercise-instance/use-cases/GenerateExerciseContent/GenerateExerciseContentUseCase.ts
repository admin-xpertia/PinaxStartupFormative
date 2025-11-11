import { Injectable, Logger, Inject } from "@nestjs/common";
import { ICommand } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import { IExerciseInstanceRepository } from "../../../../domain/exercise-instance/repositories/IExerciseInstanceRepository";
import { IExerciseContentRepository } from "../../../../domain/exercise-instance/repositories/IExerciseContentRepository";
import { IExerciseTemplateRepository } from "../../../../domain/exercise-catalog/repositories/IExerciseTemplateRepository";
import {
  IProofPointRepository,
  IFaseRepository,
  IProgramRepository,
} from "../../../../domain/program-design/repositories/IProgramRepository";
import { ExerciseContent } from "../../../../domain/exercise-instance/entities/ExerciseContent";
import { RecordId } from "../../../../domain/shared/value-objects/RecordId";
import { ContentStatus } from "../../../../domain/exercise-instance/value-objects/ContentStatus";
import { OpenAIService } from "../../../../infrastructure/ai/OpenAIService";
import {
  GenerateExerciseContentRequest,
  GenerateExerciseContentResponse,
} from "./GenerateExerciseContentDTO";

/**
 * GenerateExerciseContentUseCase
 * Generates AI-powered content for an exercise instance
 *
 * Flow:
 * 1. Load exercise instance
 * 2. Check if content already exists (unless forceRegenerate)
 * 3. Load template, proof point, fase, and program for context
 * 4. Generate content using OpenAI
 * 5. Create ExerciseContent entity
 * 6. Update exercise instance status
 * 7. Save and return
 */

@Injectable()
export class GenerateExerciseContentUseCase
  implements
    ICommand<GenerateExerciseContentRequest, GenerateExerciseContentResponse>
{
  private readonly logger = new Logger(GenerateExerciseContentUseCase.name);

  constructor(
    @Inject("IExerciseInstanceRepository")
    private readonly instanceRepository: IExerciseInstanceRepository,
    @Inject("IExerciseContentRepository")
    private readonly contentRepository: IExerciseContentRepository,
    @Inject("IExerciseTemplateRepository")
    private readonly templateRepository: IExerciseTemplateRepository,
    @Inject("IProofPointRepository")
    private readonly proofPointRepository: IProofPointRepository,
    @Inject("IFaseRepository")
    private readonly faseRepository: IFaseRepository,
    @Inject("IProgramRepository")
    private readonly programRepository: IProgramRepository,
    private readonly openAIService: OpenAIService,
  ) {}

  async execute(
    request: GenerateExerciseContentRequest,
  ): Promise<Result<GenerateExerciseContentResponse, Error>> {
    try {
      this.logger.log(
        `🤖 Generating content for exercise: ${request.exerciseInstanceId}`,
      );

      // 1. Load exercise instance
      const instanceId = RecordId.fromString(request.exerciseInstanceId);
      const instance = await this.instanceRepository.findById(instanceId);

      if (!instance) {
        return Result.fail(
          new Error(
            `Exercise instance not found: ${request.exerciseInstanceId}`,
          ),
        );
      }

      // 2. Check if content already exists (unless forceRegenerate)
      if (!request.forceRegenerate) {
        const existingContent =
          await this.contentRepository.findByInstance(instanceId);

        if (existingContent) {
          this.logger.log("Content already exists, returning existing content");
          return Result.ok({
            exerciseInstanceId: instance.getId().toString(),
            contentId: existingContent.getId().toString(),
            status: "generado",
            contentPreview: existingContent.getContenido(),
            generatedAt: existingContent.getCreatedAt().toISOString(),
          });
        }
      }

      // 3. Load template
      const template = await this.templateRepository.findById(
        instance.getTemplate(),
      );

      if (!template) {
        return Result.fail(
          new Error(`Template not found: ${instance.getTemplate().toString()}`),
        );
      }

      // 4. Load proof point
      const proofPoint = await this.proofPointRepository.findById(
        instance.getProofPoint(),
      );

      if (!proofPoint) {
        return Result.fail(
          new Error(
            `Proof point not found: ${instance.getProofPoint().toString()}`,
          ),
        );
      }

      // 5. Load fase
      const fase = await this.faseRepository.findById(proofPoint.getFase());

      if (!fase) {
        return Result.fail(
          new Error(`Fase not found: ${proofPoint.getFase().toString()}`),
        );
      }

      // 6. Load programa
      const programa = await this.programRepository.findById(
        fase.getPrograma(),
      );

      if (!programa) {
        return Result.fail(
          new Error(`Program not found: ${fase.getPrograma().toString()}`),
        );
      }

      // 7. Update instance status to "generating"
      instance.updateEstadoContenido(ContentStatus.generando());
      await this.instanceRepository.save(instance);

      this.logger.log("Context loaded, calling OpenAI...");

      // 8. Generate content with OpenAI
      const generationResult = await this.openAIService.generateExerciseContent(
        {
          template,
          configuration: instance.getConfiguracion(),
          context: {
            programa,
            fase,
            proofPoint,
            exerciseName: instance.getNombre(),
            customContext: instance.getConsideracionesContexto(),
          },
        },
      );

      this.logger.log(
        `✅ Content generated (${generationResult.tokensUsed} tokens)`,
      );

      // 9. Create ExerciseContent entity
      const content = ExerciseContent.create(
        instanceId,
        generationResult.content,
        undefined, // generacionRequestId (optional)
      );

      // 10. Save content
      const savedContent = await this.contentRepository.save(content);

      // 11. Update instance status to "generated"
      instance.updateEstadoContenido(ContentStatus.generado());
      instance.setContenidoActual(savedContent.getId());
      await this.instanceRepository.save(instance);

      this.logger.log("✅ Content generation complete");

      // 12. Return response
      return Result.ok({
        exerciseInstanceId: instance.getId().toString(),
        contentId: savedContent.getId().toString(),
        status: "generado",
        contentPreview: savedContent.getContenido(),
        tokensUsed: generationResult.tokensUsed,
        generatedAt: savedContent.getCreatedAt().toISOString(),
      });
    } catch (error) {
      this.logger.error("❌ Failed to generate exercise content", error);

      // Update instance status to "error" if it exists (fallback to sin_generar if unsupported)
      try {
        const instanceId = RecordId.fromString(request.exerciseInstanceId);
        const instance = await this.instanceRepository.findById(instanceId);

        if (instance) {
          try {
            instance.updateEstadoContenido(ContentStatus.error());
            await this.instanceRepository.save(instance);
          } catch (statusError) {
            this.logger.error(
              "Failed to set status to error, reverting to sin_generar",
              statusError,
            );
            instance.updateEstadoContenido(ContentStatus.sinGenerar());
            await this.instanceRepository.save(instance);
          }
        }
      } catch (updateError) {
        this.logger.error(
          "Failed to update instance status after error",
          updateError,
        );
      }

      return Result.fail(error as Error);
    }
  }
}
