import { Injectable, Logger } from "@nestjs/common";
import { ICommand } from "../../../shared/interfaces/IUseCase";
import { Result } from "../../../shared/types/Result";
import { SurrealDbService } from "../../../../core/database/surrealdb.service";
import { DomainEvent } from "../../../../domain/shared";

export interface ReviewAndGradeSubmissionRequest {
  submissionId: string;
  instructorId?: string;
  instructorScore: number;
  instructorFeedback?: string;
  publish: boolean;
}

export interface ReviewAndGradeSubmissionResponse {
  id: string;
  status: string;
  finalScore: number;
  aiScore?: number;
  manualFeedback?: string;
  gradedAt: string;
}

export class StudentGradePublishedEvent extends DomainEvent {
  constructor(
    public readonly submissionId: string,
    public readonly studentId: string,
    public readonly exerciseInstanceId: string,
    public readonly finalScore: number,
  ) {
    super("StudentGradePublished");
  }

  toJSON(): Record<string, any> {
    return {
      event: this.eventName,
      occurredAt: this.occurredAt.toString(),
      submissionId: this.submissionId,
      studentId: this.studentId,
      exerciseInstanceId: this.exerciseInstanceId,
      finalScore: this.finalScore,
    };
  }
}

@Injectable()
export class ReviewAndGradeSubmissionUseCase
  implements
    ICommand<ReviewAndGradeSubmissionRequest, ReviewAndGradeSubmissionResponse>
{
  private readonly logger = new Logger(ReviewAndGradeSubmissionUseCase.name);

  constructor(private readonly db: SurrealDbService) {}

  async execute(
    request: ReviewAndGradeSubmissionRequest,
  ): Promise<Result<ReviewAndGradeSubmissionResponse, Error>> {
    try {
      if (!request.submissionId) {
        return Result.fail(new Error("submissionId es requerido"));
      }

      if (isNaN(request.instructorScore)) {
        return Result.fail(
          new Error("El puntaje del instructor debe ser numérico"),
        );
      }

      const progress = await this.loadProgress(request.submissionId);
      if (!progress) {
        return Result.fail(new Error("No se encontró la entrega"));
      }

      const finalScore =
        request.publish === true
          ? request.instructorScore ?? progress.ai_score ?? 0
          : progress.final_score ?? null;

      const status = request.publish ? "graded" : "pending_review";
      const gradedAt =
        request.publish && finalScore !== null
          ? new Date().toISOString()
          : progress.graded_at ?? null;

      const updateResult = await this.db.query(
        `
        UPDATE type::thing($progressId) SET
          status = $status,
          estado = $estado,
          instructor_score = $instructorScore,
          manual_feedback = $instructorFeedback,
          final_score = $finalScore,
          graded_at = $gradedAt,
          updated_at = time::now()
        RETURN AFTER
      `,
        {
          progressId: progress.id,
          status,
          estado: status === "graded" ? "completado" : "pendiente_revision",
          instructorScore: request.instructorScore,
          instructorFeedback: request.instructorFeedback ?? null,
          finalScore,
          gradedAt,
        },
      );

      const updated = this.extractFirstRecord(updateResult);
      if (!updated) {
        return Result.fail(new Error("No se pudo actualizar la entrega"));
      }

      if (status === "graded" && finalScore !== null) {
        const event = new StudentGradePublishedEvent(
          updated.id,
          updated.estudiante,
          updated.exercise_instance,
          finalScore,
        );
        this.logger.log(
          `📢 StudentGradePublished: ${JSON.stringify(event.toJSON())}`,
        );
      }

      return Result.ok({
        id: updated.id,
        status,
        finalScore: finalScore ?? updated.final_score ?? request.instructorScore,
        aiScore: updated.ai_score ?? progress.ai_score ?? null,
        manualFeedback: updated.manual_feedback ?? request.instructorFeedback,
        gradedAt: updated.graded_at || new Date().toISOString(),
      });
    } catch (error) {
      this.logger.error("Error al calificar la entrega", error);
      return Result.fail(error as Error);
    }
  }

  private async loadProgress(id: string): Promise<any | null> {
    const result = await this.db.query(
      `
      SELECT * FROM type::thing($id)
    `,
      { id },
    );

    return this.extractFirstRecord(result);
  }

  private extractFirstRecord(result: any): any | null {
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        return result[0][0];
      }
      if (!Array.isArray(result[0])) {
        return result[0];
      }
    }
    return null;
  }
}
