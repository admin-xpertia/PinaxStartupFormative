import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { SurrealDbService } from 'src/core/database';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly surrealDb: SurrealDbService) {}

  /**
   * Verifica que el instructor tiene acceso a la cohorte
   */
  private async verificarAccesoCohorte(
    cohorteId: string,
    instructorId: string,
  ): Promise<void> {
    const query = `
      SELECT instructor FROM ${cohorteId};
    `;

    const result = await this.surrealDb.query<any>(query);

    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new NotFoundException('Cohorte no encontrada');
    }

    const cohorte = result[0];
    const cohorteInstructorId = this.extractIdFromRecord(cohorte.instructor);

    if (cohorteInstructorId !== instructorId) {
      throw new ForbiddenException('No tienes acceso a esta cohorte');
    }
  }

  /**
   * Extrae el ID de un record de SurrealDB
   */
  private extractIdFromRecord(record: any): string {
    if (!record) return null;
    if (typeof record === 'string') {
      return record.includes(':') ? record : `user:${record}`;
    }
    if (record.id) {
      return typeof record.id === 'string' ? record.id : record.id.toString();
    }
    return record.toString();
  }

  /**
   * Normaliza un ID para asegurar que tiene el formato correcto
   */
  private normalizeId(id: string, table?: string): string {
    if (!id) return null;
    if (id.includes(':')) return id;
    return table ? `${table}:${id}` : id;
  }

  /**
   * Obtiene puntos de fricción para una cohorte
   * Para: friction-points-panel.tsx
   */
  async getFrictionPoints(cohorteId: string, instructorId: string) {
    this.logger.log(`Obteniendo puntos de fricción para cohorte ${cohorteId}`);

    const normalizedCohorteId = this.normalizeId(cohorteId, 'cohorte');
    await this.verificarAccesoCohorte(normalizedCohorteId, instructorId);

    const query = `
      SELECT
        *,
        componente_snapshot.nombre AS componente_nombre,
        componente_snapshot.tipo AS componente_tipo,
        componente_snapshot.orden AS componente_orden
      FROM punto_de_friccion
      WHERE cohorte = ${normalizedCohorteId}
      ORDER BY severidad DESC, porcentaje_afectados DESC
      FETCH componente_snapshot;
    `;

    const result = await this.surrealDb.query(query);
    return result || [];
  }

  /**
   * Obtiene análisis cualitativo para una cohorte
   * Para: qualitative-analysis.tsx
   */
  async getQualitativeAnalysis(cohorteId: string, instructorId: string) {
    this.logger.log(`Obteniendo análisis cualitativo para cohorte ${cohorteId}`);

    const normalizedCohorteId = this.normalizeId(cohorteId, 'cohorte');
    await this.verificarAccesoCohorte(normalizedCohorteId, instructorId);

    const query = `
      SELECT *
      FROM analisis_cualitativo
      WHERE cohorte = ${normalizedCohorteId}
      ORDER BY frecuencia DESC;
    `;

    const result = await this.surrealDb.query(query);
    return result || [];
  }

  /**
   * Obtiene datos para el heatmap de progreso
   * Para: progress-heatmap.tsx
   */
  async getHeatmapData(cohorteId: string, instructorId: string) {
    this.logger.log(`Obteniendo datos de heatmap para cohorte ${cohorteId}`);

    const normalizedCohorteId = this.normalizeId(cohorteId, 'cohorte');
    await this.verificarAccesoCohorte(normalizedCohorteId, instructorId);

    // Obtener todos los componentes de la cohorte (a través del snapshot)
    const componentesQuery = `
      SELECT
        id,
        nombre,
        tipo,
        orden
      FROM snapshot_componente
      WHERE snapshot_nivel.snapshot_proofpoint.snapshot_fase.snapshot_programa.id IN (
        SELECT snapshot_programa.id FROM ${normalizedCohorteId}
      )
      ORDER BY orden ASC;
    `;

    const componentes = await this.surrealDb.query(componentesQuery);

    // Obtener todas las inscripciones con sus estudiantes
    const inscripcionesQuery = `
      SELECT
        id,
        estudiante.user.nombre AS estudiante_nombre,
        estudiante.user.avatar AS estudiante_avatar,
        estudiante.id AS estudiante_id,
        estado
      FROM inscripcion_cohorte
      WHERE cohorte = ${normalizedCohorteId}
      FETCH estudiante, estudiante.user
      ORDER BY estudiante.user.nombre ASC;
    `;

    const inscripciones = await this.surrealDb.query(inscripcionesQuery);

    // Para cada inscripción, obtener su progreso en cada componente
    const heatmapData = [];

    for (const inscripcion of inscripciones || []) {
      const estudianteId = inscripcion.estudiante_id;

      // Obtener progreso del estudiante en todos los componentes
      const progresoQuery = `
        SELECT
          componente AS componente_snapshot,
          estado,
          score,
          tiempo_invertido_minutos
        FROM progreso_componente
        WHERE estudiante = ${estudianteId}
        ORDER BY componente.orden ASC;
      `;

      const progresos = await this.surrealDb.query(progresoQuery);

      // Crear un mapa de progreso por componente
      const progresoMap = new Map();
      for (const progreso of progresos || []) {
        const compId = this.extractIdFromRecord(progreso.componente_snapshot);
        progresoMap.set(compId, progreso);
      }

      // Construir el array de progreso para todos los componentes
      const progresosOrdenados = (componentes || []).map((comp: any) => {
        const compId = this.extractIdFromRecord(comp.id);
        const progreso = progresoMap.get(compId);

        if (!progreso) {
          return {
            componente_snapshot: compId,
            estado: 'no_iniciado',
            score: 0,
            tiempo_invertido_minutos: 0,
            orden: comp.orden,
          };
        }

        return {
          ...progreso,
          orden: comp.orden,
        };
      });

      heatmapData.push({
        inscripcionId: this.extractIdFromRecord(inscripcion.id),
        estudianteNombre: inscripcion.estudiante_nombre,
        estudianteAvatar: inscripcion.estudiante_avatar,
        estudianteId: estudianteId,
        estudianteEstado: inscripcion.estado,
        progresos: progresosOrdenados,
      });
    }

    return {
      componentes: componentes || [],
      estudiantes: heatmapData,
    };
  }

  /**
   * Obtiene detalle de progreso de un estudiante
   * Para: student-detail-view.tsx
   */
  async getStudentProgressDetail(
    estudianteId: string,
    cohorteId: string,
    instructorId: string,
  ) {
    this.logger.log(
      `Obteniendo detalle de progreso del estudiante ${estudianteId} en cohorte ${cohorteId}`,
    );

    const normalizedCohorteId = this.normalizeId(cohorteId, 'cohorte');
    const normalizedEstudianteId = this.normalizeId(estudianteId, 'estudiante');

    await this.verificarAccesoCohorte(normalizedCohorteId, instructorId);

    // Obtener información del estudiante
    const estudianteQuery = `
      SELECT
        id,
        user.nombre AS nombre,
        user.email AS email,
        user.avatar AS avatar
      FROM ${normalizedEstudianteId}
      FETCH user;
    `;

    const estudianteResult = await this.surrealDb.query(estudianteQuery);
    if (!estudianteResult || estudianteResult.length === 0) {
      throw new NotFoundException('Estudiante no encontrado');
    }

    const estudiante = estudianteResult[0];

    // Obtener progreso completo del estudiante
    const progresoQuery = `
      SELECT
        *,
        componente.nombre AS componente_nombre,
        componente.tipo AS componente_tipo,
        componente.orden AS componente_orden
      FROM progreso_componente
      WHERE estudiante = ${normalizedEstudianteId}
      ORDER BY componente.orden ASC
      FETCH componente;
    `;

    const progresos = await this.surrealDb.query(progresoQuery);

    // Para cada progreso, obtener datos adicionales
    const progresoDetallado = [];

    for (const progreso of progresos || []) {
      const progresoId = this.extractIdFromRecord(progreso.id);

      // Obtener datos del estudiante (si es cuaderno)
      const datosQuery = `
        SELECT * FROM datos_estudiante
        WHERE progreso_componente = ${progresoId};
      `;
      const datos = await this.surrealDb.query(datosQuery);

      // Obtener evaluación
      const evaluacionQuery = `
        SELECT * FROM evaluacion_resultado
        WHERE progreso_componente = ${progresoId};
      `;
      const evaluacion = await this.surrealDb.query(evaluacionQuery);

      progresoDetallado.push({
        ...progreso,
        datos_estudiante: datos && datos.length > 0 ? datos[0] : null,
        evaluacion_resultado:
          evaluacion && evaluacion.length > 0 ? evaluacion[0] : null,
      });
    }

    return {
      estudiante,
      progreso: progresoDetallado,
    };
  }

  /**
   * Obtiene métricas generales de una cohorte
   */
  async getCohorteMetrics(cohorteId: string, instructorId: string) {
    this.logger.log(`Obteniendo métricas para cohorte ${cohorteId}`);

    const normalizedCohorteId = this.normalizeId(cohorteId, 'cohorte');
    await this.verificarAccesoCohorte(normalizedCohorteId, instructorId);

    // Obtener métricas por componente
    const metricasQuery = `
      SELECT
        *,
        componente_snapshot.nombre AS componente_nombre,
        componente_snapshot.tipo AS componente_tipo,
        componente_snapshot.orden AS componente_orden
      FROM metricas_componente
      WHERE cohorte = ${normalizedCohorteId}
      ORDER BY componente_snapshot.orden ASC
      FETCH componente_snapshot;
    `;

    const metricas = await this.surrealDb.query(metricasQuery);

    // Obtener estadísticas generales de la cohorte
    const statsQuery = `
      SELECT
        count() AS total_estudiantes,
        count(estado = 'activo') AS estudiantes_activos,
        math::avg(progreso_general) AS progreso_promedio
      FROM inscripcion_cohorte
      WHERE cohorte = ${normalizedCohorteId}
      GROUP ALL;
    `;

    const stats = await this.surrealDb.query(statsQuery);

    return {
      metricas: metricas || [],
      estadisticas: stats && stats.length > 0 ? stats[0] : null,
    };
  }
}
