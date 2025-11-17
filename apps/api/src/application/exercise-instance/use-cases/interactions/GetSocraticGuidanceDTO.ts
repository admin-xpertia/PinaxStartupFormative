/**
 * Request/Response DTOs for Socratic Guidance (Mentor IA) Use Case
 */

export interface GetSocraticGuidanceRequest {
  exerciseInstanceId: string;
  studentInput: string; // Current text/draft from student
  currentStep?: string; // Which step/section the student is on
  context?: {
    stepTitle?: string;
    stepDescription?: string;
    previousAttempts?: number;
  };
}

export interface GetSocraticGuidanceResponse {
  guidance: string;
  followUpQuestions?: string[];
  references?: string[];
  encouragementLevel: "low" | "medium" | "high";
}
