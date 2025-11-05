import { Controller, Get, Param, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from 'src/core/guards/auth.guard';

@Controller('cohortes/:cohorteId/analytics')
@UseGuards(AuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /cohortes/:cohorteId/analytics/friction-points
   * Obtiene los puntos de fricción detectados en una cohorte
   */
  @Get('friction-points')
  async getFrictionPoints(@Param('cohorteId') cohorteId: string, @Request() req: any) {
    const instructorId = req.user.userId;
    return this.analyticsService.getFrictionPoints(cohorteId, instructorId);
  }

  /**
   * GET /cohortes/:cohorteId/analytics/qualitative
   * Obtiene el análisis cualitativo (temas y misconceptions)
   */
  @Get('qualitative')
  async getQualitativeAnalysis(@Param('cohorteId') cohorteId: string, @Request() req: any) {
    const instructorId = req.user.userId;
    return this.analyticsService.getQualitativeAnalysis(cohorteId, instructorId);
  }

  /**
   * GET /cohortes/:cohorteId/analytics/heatmap
   * Obtiene los datos para el heatmap de progreso
   */
  @Get('heatmap')
  async getHeatmapData(@Param('cohorteId') cohorteId: string, @Request() req: any) {
    const instructorId = req.user.userId;
    return this.analyticsService.getHeatmapData(cohorteId, instructorId);
  }

  /**
   * GET /cohortes/:cohorteId/analytics/metrics
   * Obtiene métricas generales de la cohorte
   */
  @Get('metrics')
  async getCohorteMetrics(@Param('cohorteId') cohorteId: string, @Request() req: any) {
    const instructorId = req.user.userId;
    return this.analyticsService.getCohorteMetrics(cohorteId, instructorId);
  }
}

/**
 * Controlador para detalle de estudiantes
 */
@Controller('cohortes/:cohorteId/estudiantes/:estudianteId')
@UseGuards(AuthGuard)
export class StudentDetailController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /cohortes/:cohorteId/estudiantes/:estudianteId/progress-detail
   * Obtiene el detalle completo de progreso de un estudiante
   */
  @Get('progress-detail')
  async getStudentProgressDetail(
    @Param('cohorteId') cohorteId: string,
    @Param('estudianteId') estudianteId: string,
    @Request() req: any,
  ) {
    const instructorId = req.user.userId;
    return this.analyticsService.getStudentProgressDetail(
      estudianteId,
      cohorteId,
      instructorId,
    );
  }
}
