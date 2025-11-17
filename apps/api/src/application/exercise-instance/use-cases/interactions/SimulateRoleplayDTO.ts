/**
 * Request/Response DTOs for Roleplay Simulation Use Case
 */

export interface SimulateRoleplayRequest {
  exerciseInstanceId: string;
  userMessage: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  currentState?: {
    objectivesMet?: number[];
    turn?: number;
    emotionalState?: string;
  };
}

export interface SimulateRoleplayResponse {
  reply: string;
  objectivesMet: number[];
  emotionalState: string;
  evaluation: Record<string, any>;
  shouldEnd: boolean;
}
