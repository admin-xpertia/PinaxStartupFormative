import { Injectable, Logger } from "@nestjs/common";
import { SurrealDbService } from "../../../core/database/surrealdb.service";
import { CohortMapper } from "../../mappers/CohortMapper";
import { IEnrollmentRepository } from "../../../domain/cohort/repositories/ICohortRepository";
import { CohorteInscripcion } from "../../../domain/cohort/entities/CohorteInscripcion";
import { RecordId } from "../../../domain/shared/value-objects/RecordId";

@Injectable()
export class CohortEnrollmentRepository implements IEnrollmentRepository {
  private readonly logger = new Logger(CohortEnrollmentRepository.name);

  constructor(
    private readonly db: SurrealDbService,
    private readonly mapper: CohortMapper,
  ) {}

  async findById(id: RecordId): Promise<CohorteInscripcion | null> {
    try {
      const result = await this.db.select<any>(id.toString());
      if (!result || result.length === 0) {
        return null;
      }
      return this.mapper.enrollmentToDomain(result[0]);
    } catch (error) {
      this.logger.error(
        `Error finding enrollment by id ${id.toString()}`,
        error,
      );
      throw error;
    }
  }

  async findAll(): Promise<CohorteInscripcion[]> {
    try {
      const result = await this.db.select<any>("inscripcion_cohorte");
      return result.map((raw) => this.mapper.enrollmentToDomain(raw));
    } catch (error) {
      this.logger.error("Error finding all enrollments", error);
      throw error;
    }
  }

  async save(enrollment: CohorteInscripcion): Promise<CohorteInscripcion> {
    try {
      const data = this.mapper.enrollmentToPersistence(enrollment);
      const {
        fecha_inscripcion,
        fecha_completacion,
        ultima_actividad,
        ...rest
      } = data;

      const datetimeFields = {
        fecha_inscripcion,
        fecha_completacion,
        ultima_actividad,
      };
      const id = enrollment.getId().toString();
      const exists = await this.exists(enrollment.getId());

      if (exists) {
        const updateQuery = `
          UPDATE type::thing($id) MERGE $data;
          UPDATE type::thing($id) SET updated_at = time::now();
        `;
        await this.db.query(updateQuery, { id, data: rest });
        await this.updateDatetimeFields(id, datetimeFields);
      } else {
        await this.db.create(id, rest);
        await this.updateDatetimeFields(id, datetimeFields, {
          updateTimestamp: true,
        });
      }

      const saved = await this.findById(enrollment.getId());
      return saved!;
    } catch (error) {
      this.logger.error(
        `Error saving enrollment ${enrollment.getId().toString()}`,
        error,
      );
      throw error;
    }
  }

  async delete(id: RecordId): Promise<boolean> {
    try {
      const exists = await this.exists(id);
      if (!exists) {
        return false;
      }
      await this.db.delete(id.toString());
      return true;
    } catch (error) {
      this.logger.error(`Error deleting enrollment ${id.toString()}`, error);
      throw error;
    }
  }

  async exists(id: RecordId): Promise<boolean> {
    const enrollment = await this.findById(id);
    return enrollment !== null;
  }

  async findByStudent(estudianteId: RecordId): Promise<CohorteInscripcion[]> {
    try {
      const query = `
        SELECT * FROM inscripcion_cohorte
        WHERE estudiante = type::thing($estudianteId)
        ORDER BY fecha_inscripcion DESC
      `;
      const result = await this.db.query<any[]>(query, {
        estudianteId: estudianteId.toString(),
      });
      return result.map((raw) => this.mapper.enrollmentToDomain(raw));
    } catch (error) {
      this.logger.error(
        `Error finding enrollments for student ${estudianteId.toString()}`,
        error,
      );
      throw error;
    }
  }

  async findByCohort(cohorteId: RecordId): Promise<CohorteInscripcion[]> {
    try {
      const query = `
        SELECT * FROM inscripcion_cohorte
        WHERE cohorte = type::thing($cohorteId)
        ORDER BY fecha_inscripcion DESC
      `;
      const result = await this.db.query<any[]>(query, {
        cohorteId: cohorteId.toString(),
      });
      return result.map((raw) => this.mapper.enrollmentToDomain(raw));
    } catch (error) {
      this.logger.error(
        `Error finding enrollments for cohort ${cohorteId.toString()}`,
        error,
      );
      throw error;
    }
  }

  async findByStudentAndCohort(
    estudianteId: RecordId,
    cohorteId: RecordId,
  ): Promise<CohorteInscripcion | null> {
    try {
      const query = `
        SELECT * FROM inscripcion_cohorte
        WHERE estudiante = type::thing($estudianteId)
          AND cohorte = type::thing($cohorteId)
        LIMIT 1
      `;
      const result = await this.db.query<any[]>(query, {
        estudianteId: estudianteId.toString(),
        cohorteId: cohorteId.toString(),
      });

      if (!result || result.length === 0) {
        return null;
      }

      return this.mapper.enrollmentToDomain(result[0]);
    } catch (error) {
      this.logger.error(
        `Error finding enrollment for student ${estudianteId.toString()} in cohort ${cohorteId.toString()}`,
        error,
      );
      throw error;
    }
  }

  private async updateDatetimeFields(
    id: string,
    dates: {
      fecha_inscripcion?: string;
      fecha_completacion?: string;
      ultima_actividad?: string;
    },
    options?: { updateTimestamp?: boolean },
  ): Promise<void> {
    const setClauses: string[] = [];
    const vars: Record<string, any> = { id };

    if (dates.fecha_inscripcion) {
      setClauses.push("fecha_inscripcion = type::datetime($fecha_inscripcion)");
      vars.fecha_inscripcion = dates.fecha_inscripcion;
    }

    if (dates.fecha_completacion) {
      setClauses.push(
        "fecha_completacion = type::datetime($fecha_completacion)",
      );
      vars.fecha_completacion = dates.fecha_completacion;
    }

    if (dates.ultima_actividad) {
      setClauses.push("ultima_actividad = type::datetime($ultima_actividad)");
      vars.ultima_actividad = dates.ultima_actividad;
    }

    if (options?.updateTimestamp && setClauses.length > 0) {
      setClauses.push("updated_at = time::now()");
    }

    if (setClauses.length === 0) {
      return;
    }

    const query = `
      UPDATE type::thing($id) SET
        ${setClauses.join(",\n        ")};
    `;

    await this.db.query(query, vars);
  }
}
