/**
 * Request/Response DTOs for Simulation Turn Processing
 */

export interface ProcessSimulationTurnRequest {
  exerciseInstanceId: string;
  studentId?: string; // For state persistence
  action: string; // Description of action taken
  currentState: Record<string, any>; // Current simulation variables
}

export interface ProcessSimulationTurnResponse {
  narrativa: string;
  estadoActualizado: Record<string, any>;
  eventos?: Array<{
    tipo: string;
    mensaje: string;
    impacto?: Record<string, any>;
  }>;
  finalizado: boolean;
  resultado?: {
    tipo: "exito" | "fracaso" | "neutro";
    mensaje: string;
    puntajeFinal?: number;
  };
}
