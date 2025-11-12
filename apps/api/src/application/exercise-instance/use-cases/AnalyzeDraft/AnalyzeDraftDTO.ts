/**
 * Request DTO for analyzing a draft text against rubric criteria
 */
export interface AnalyzeDraftRequest {
  exerciseInstanceId: string;
  questionId: string;
  draftText: string;
}

/**
 * Response DTO with AI-generated suggestion
 */
export interface AnalyzeDraftResponse {
  questionId: string;
  suggestion: string;
  strengths?: string[];
  improvements?: string[];
  rubricAlignment?: number; // 0-100
}
