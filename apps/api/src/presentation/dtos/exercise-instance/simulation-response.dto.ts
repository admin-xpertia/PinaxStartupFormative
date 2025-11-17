import { ApiProperty } from "@nestjs/swagger";

/**
 * Response DTO for Environment Simulation interactions
 * Used by SimuladorEntornoPlayer
 */
export class SimulationResponseDto {
  @ApiProperty({
    description: "Narrative description of what happened",
    example: "Tu decisión de invertir en marketing digital generó un aumento del 15% en visibilidad, pero consumió el 30% de tu presupuesto mensual.",
  })
  narrativa: string;

  @ApiProperty({
    description: "Updated simulation variables after the action",
    example: {
      presupuesto: 7000,
      moral: 85,
      clientes: 120,
      semana: 3,
    },
  })
  estadoActualizado: Record<string, any>;

  @ApiProperty({
    description: "Events triggered by the action",
    example: [
      {
        tipo: "oportunidad",
        mensaje: "Un inversor se ha interesado en tu startup",
      },
    ],
    required: false,
  })
  eventos?: Array<{
    tipo: string;
    mensaje: string;
    impacto?: Record<string, any>;
  }>;

  @ApiProperty({
    description: "Whether the simulation has ended (success/failure/time limit)",
    example: false,
    required: false,
  })
  finalizado?: boolean;

  @ApiProperty({
    description: "End result if simulation is finished",
    required: false,
  })
  resultado?: {
    tipo: "exito" | "fracaso" | "neutro";
    mensaje: string;
    puntajeFinal?: number;
  };
}
