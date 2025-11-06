import { Injectable } from "@nestjs/common";
import { SurrealDbService } from "../../core/database/surrealdb.service";

export interface DashboardStats {
  totalPrograms: number;
  totalStudents: number;
  activeCohortes: number;
  avgCompletionRate: number;
}

@Injectable()
export class DashboardStatsService {
  constructor(private readonly db: SurrealDbService) {}

  async getStats(instructorId: string): Promise<DashboardStats> {
    try {
      // Query programas del instructor
      const programasResult = await this.db.query<{ count: number }[]>(
        `SELECT count() as count FROM programa WHERE instructor = $instructor GROUP ALL`,
        { instructor: instructorId },
      );
      const totalPrograms =
        Array.isArray(programasResult) && programasResult[0]?.count
          ? programasResult[0].count
          : 0;

      // Query cohortes activas del instructor
      const cohortesResult = await this.db.query<{ count: number }[]>(
        `SELECT count() as count FROM cohorte
         WHERE programa.instructor = $instructor AND estado = 'activa'
         GROUP ALL`,
        { instructor: instructorId },
      );
      const activeCohortes =
        Array.isArray(cohortesResult) && cohortesResult[0]?.count
          ? cohortesResult[0].count
          : 0;

      // Query total de estudiantes en todas las cohortes del instructor
      const estudiantesResult = await this.db.query<{ total: number }[]>(
        `SELECT count() as total FROM estudiante_cohorte
         WHERE cohorte.programa.instructor = $instructor
         GROUP ALL`,
        { instructor: instructorId },
      );
      const totalStudents =
        Array.isArray(estudiantesResult) && estudiantesResult[0]?.total
          ? estudiantesResult[0].total
          : 0;

      // Query tasa de completación promedio
      const completionResult = await this.db.query<
        { avg_completion: number }[]
      >(
        `SELECT math::mean(progreso_porcentaje) as avg_completion
         FROM progreso
         WHERE estudiante.cohorte.programa.instructor = $instructor
         GROUP ALL`,
        { instructor: instructorId },
      );
      const avgCompletionRate =
        Array.isArray(completionResult) && completionResult[0]?.avg_completion
          ? Math.round(completionResult[0].avg_completion)
          : 0;

      return {
        totalPrograms,
        totalStudents,
        activeCohortes,
        avgCompletionRate,
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      // Return defaults if error
      return {
        totalPrograms: 0,
        totalStudents: 0,
        activeCohortes: 0,
        avgCompletionRate: 0,
      };
    }
  }
}
