import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../infrastructure/database/database.service';

export interface DashboardStats {
  totalPrograms: number;
  totalStudents: number;
  activeCohortes: number;
  avgCompletionRate: number;
}

@Injectable()
export class DashboardStatsService {
  constructor(private readonly db: DatabaseService) {}

  async getStats(instructorId: string): Promise<DashboardStats> {
    try {
      // Query programas del instructor
      const programasResult = await this.db.query<{ count: number }>(
        `SELECT count() as count FROM programa WHERE instructor = $instructor GROUP ALL`,
        { instructor: instructorId }
      );
      const totalPrograms = programasResult[0]?.count || 0;

      // Query cohortes activas del instructor
      const cohortesResult = await this.db.query<{ count: number }>(
        `SELECT count() as count FROM cohorte
         WHERE programa.instructor = $instructor AND estado = 'activa'
         GROUP ALL`,
        { instructor: instructorId }
      );
      const activeCohortes = cohortesResult[0]?.count || 0;

      // Query total de estudiantes en todas las cohortes del instructor
      const estudiantesResult = await this.db.query<{ total: number }>(
        `SELECT count() as total FROM estudiante_cohorte
         WHERE cohorte.programa.instructor = $instructor
         GROUP ALL`,
        { instructor: instructorId }
      );
      const totalStudents = estudiantesResult[0]?.total || 0;

      // Query tasa de completación promedio
      const completionResult = await this.db.query<{ avg_completion: number }>(
        `SELECT math::mean(progreso_porcentaje) as avg_completion
         FROM progreso
         WHERE estudiante.cohorte.programa.instructor = $instructor
         GROUP ALL`,
        { instructor: instructorId }
      );
      const avgCompletionRate = Math.round(completionResult[0]?.avg_completion || 0);

      return {
        totalPrograms,
        totalStudents,
        activeCohortes,
        avgCompletionRate,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
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
