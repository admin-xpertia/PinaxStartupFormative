export class ProgramVersionDto {
  version: string;
  estado: "actual" | "anterior" | "beta";
  fecha: string;
  cambios: string[];
  cohortes_usando: number;
  recomendada?: boolean;
  advertencia?: string;
}
