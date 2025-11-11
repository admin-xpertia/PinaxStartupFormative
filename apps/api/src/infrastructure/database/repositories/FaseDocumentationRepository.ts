import { Injectable, Logger } from "@nestjs/common";
import { IFaseDocumentationRepository } from "../../../domain/program-design/repositories/IProgramRepository";
import { FaseDocumentation } from "../../../domain/program-design/entities/FaseDocumentation";
import { RecordId } from "../../../domain/shared/value-objects/RecordId";
import { SurrealDbService } from "../../../core/database/surrealdb.service";
import { ProgramMapper } from "../../mappers/ProgramMapper";

/**
 * FaseDocumentationRepository
 * Concrete implementation of IFaseDocumentationRepository using SurrealDB
 */
@Injectable()
export class FaseDocumentationRepository
  implements IFaseDocumentationRepository
{
  private readonly logger = new Logger(FaseDocumentationRepository.name);

  constructor(
    private readonly db: SurrealDbService,
    private readonly mapper: ProgramMapper,
  ) {}

  /**
   * Finds documentation by ID
   */
  async findById(id: RecordId): Promise<FaseDocumentation | null> {
    try {
      const result = await this.db.select<any>(id.toString());

      if (!result || result.length === 0) {
        return null;
      }

      return this.mapper.faseDocumentationToDomain(result[0]);
    } catch (error) {
      this.logger.error(
        `Error finding documentation by id: ${id.toString()}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Finds all documentation
   */
  async findAll(criteria?: any): Promise<FaseDocumentation[]> {
    try {
      void criteria; // filters not implemented yet
      const result = await this.db.select<any>("fase_documentation");
      return result.map((raw) => this.mapper.faseDocumentationToDomain(raw));
    } catch (error) {
      this.logger.error("Error finding all documentation", error);
      throw error;
    }
  }

  /**
   * Saves documentation (insert or update)
   */
  async save(documentation: FaseDocumentation): Promise<FaseDocumentation> {
    try {
      const data = this.mapper.faseDocumentationToPersistence(documentation);
      const id = documentation.getId().toString();

      // Check if exists
      const exists = await this.exists(documentation.getId());

      if (exists) {
        // Update existing
        await this.db.update(id, data);
      } else {
        // Create new
        await this.db.create(id, data);
      }

      // Return the saved documentation
      const saved = await this.findById(documentation.getId());
      return saved!;
    } catch (error) {
      this.logger.error(
        `Error saving documentation: ${documentation.getId().toString()}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Deletes documentation by ID
   */
  async delete(id: RecordId): Promise<boolean> {
    try {
      const exists = await this.exists(id);
      if (!exists) {
        return false;
      }

      await this.db.delete(id.toString());
      return true;
    } catch (error) {
      this.logger.error(
        `Error deleting documentation: ${id.toString()}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Checks if documentation exists
   */
  async exists(id: RecordId): Promise<boolean> {
    try {
      const result = await this.findById(id);
      return result !== null;
    } catch (error) {
      this.logger.error(
        `Error checking if documentation exists: ${id.toString()}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Finds documentation for a specific fase
   */
  async findByFase(faseId: RecordId): Promise<FaseDocumentation | null> {
    try {
      const query = `
        SELECT * FROM fase_documentation
        WHERE fase = $faseId
        LIMIT 1
      `;

      const result = await this.db.query<any[]>(query, {
        faseId: faseId.toString(),
      });

      if (result.length === 0) {
        return null;
      }

      return this.mapper.faseDocumentationToDomain(result[0]);
    } catch (error) {
      this.logger.error(
        `Error finding documentation by fase: ${faseId.toString()}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Finds all documentation for a program
   */
  async findByPrograma(programaId: RecordId): Promise<FaseDocumentation[]> {
    try {
      // First get all fases for the program
      const fasesQuery = `
        SELECT id FROM fase
        WHERE programa = $programaId
      `;

      const fasesResult = await this.db.query<any[]>(fasesQuery, {
        programaId: programaId.toString(),
      });

      if (fasesResult.length === 0) {
        return [];
      }

      const faseIds = fasesResult.map((f) => f.id);

      // Then get documentation for those fases
      const docsQuery = `
        SELECT * FROM fase_documentation
        WHERE fase IN $faseIds
      `;

      const docsResult = await this.db.query<any[]>(docsQuery, {
        faseIds,
      });

      return docsResult.map((raw) =>
        this.mapper.faseDocumentationToDomain(raw),
      );
    } catch (error) {
      this.logger.error(
        `Error finding documentation by programa: ${programaId.toString()}`,
        error,
      );
      throw error;
    }
  }
}
