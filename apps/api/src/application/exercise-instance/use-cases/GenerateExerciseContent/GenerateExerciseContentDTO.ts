/**
 * Generate Exercise Content DTO
 */

export interface GenerateExerciseContentRequest {
  exerciseInstanceId: string;
  forceRegenerate?: boolean; // If true, regenerates even if content already exists
}

export interface GenerateExerciseContentResponse {
  exerciseInstanceId: string;
  contentId: string;
  status: string; // 'generado' | 'error'
  contentPreview?: any;
  tokensUsed?: number;
  generatedAt: string;
}
