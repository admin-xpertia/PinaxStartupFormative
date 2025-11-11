import { Injectable, Logger } from "@nestjs/common";
import { SurrealDbService } from "../../../core/database/surrealdb.service";
import { CohortMapper } from "../../mappers/CohortMapper";
import { ICohortRepository } from "../../../domain/cohort/repositories/ICohortRepository";
import { Cohorte } from "../../../domain/cohort/entities/Cohorte";
import { RecordId } from "../../../domain/shared/value-objects/RecordId";

@Injectable()
export class CohortRepository implements ICohortRepository {
  private readonly logger = new Logger(CohortRepository.name);

  constructor(
    private readonly db: SurrealDbService,
    private readonly mapper: CohortMapper,
  ) {}

  async findById(id: RecordId): Promise<Cohorte | null> {
    try {
      const result = await this.db.select<any>(id.toString());
      if (!result || result.length === 0) {
        return null;
      }
      return this.mapper.cohorteToDomain(result[0]);
    } catch (error) {
      this.logger.error(`Error finding cohort by id ${id.toString()}`, error);
      throw error;
    }
  }

  async findAll(): Promise<Cohorte[]> {
    try {
      const result = await this.db.select<any>("cohorte");
      return result.map((raw) => this.mapper.cohorteToDomain(raw));
    } catch (error) {
      this.logger.error("Error finding all cohorts", error);
      throw error;
    }
  }

  async save(cohorte: Cohorte): Promise<Cohorte> {
    try {
      const rawData = this.mapper.cohorteToPersistence(cohorte);
      const data = this.preparePayload(rawData);
      const id = cohorte.getId().toString();
      const exists = await this.exists(cohorte.getId());

      if (exists) {
        const { fecha_inicio, fecha_fin, ...rest } = data;
        const updateQuery = `
          UPDATE type::thing($id) MERGE $data;
          UPDATE type::thing($id) SET
            fecha_inicio = type::datetime($fecha_inicio),
            fecha_fin = type::datetime($fecha_fin),
            updated_at = time::now();
        `;
        await this.db.query(updateQuery, {
          id,
          data: rest,
          fecha_inicio,
          fecha_fin,
        });
      } else {
        const createQuery = `
          CREATE type::thing($id) CONTENT {
            nombre: $nombre,
            descripcion: $descripcion,
            programa: $programa,
            estado: $estado,
            fecha_inicio: type::datetime($fecha_inicio),
            fecha_fin: type::datetime($fecha_fin),
            configuracion: $configuracion,
            snapshot_programa: $snapshot_programa,
            instructor: $instructor,
            capacidad_maxima: $capacidad_maxima,
            activo: $activo
          };
        `;

        await this.db.query(createQuery, {
          id,
          ...data,
        });
      }

      const saved = await this.findById(cohorte.getId());
      return saved!;
    } catch (error) {
      this.logger.error(
        `Error saving cohort ${cohorte.getId().toString()}`,
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
      this.logger.error(`Error deleting cohort ${id.toString()}`, error);
      throw error;
    }
  }

  async exists(id: RecordId): Promise<boolean> {
    const cohort = await this.findById(id);
    return cohort !== null;
  }

  async findByProgram(programaId: RecordId): Promise<Cohorte[]> {
    try {
      const query = `
        SELECT * FROM cohorte
        WHERE programa = type::thing($programaId)
        ORDER BY fecha_inicio DESC
      `;
      const result = await this.db.query<any[]>(query, {
        programaId: programaId.toString(),
      });
      return result.map((raw) => this.mapper.cohorteToDomain(raw));
    } catch (error) {
      this.logger.error(
        `Error finding cohorts for program ${programaId.toString()}`,
        error,
      );
      throw error;
    }
  }

  private preparePayload(data: any): any {
    return {
      ...data,
      descripcion: data.descripcion ?? undefined,
      snapshot_programa: data.snapshot_programa ?? undefined,
      instructor: data.instructor ?? undefined,
      capacidad_maxima: data.capacidad_maxima ?? undefined,
      configuracion: data.configuracion ?? {},
    };
  }
}
