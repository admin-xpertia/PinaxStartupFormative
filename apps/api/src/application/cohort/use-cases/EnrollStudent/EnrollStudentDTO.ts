export interface EnrollStudentDTO {
  cohorteId: string;
  estudianteId: string;
  estado?: "activo" | "completado" | "abandonado" | "suspendido";
}
