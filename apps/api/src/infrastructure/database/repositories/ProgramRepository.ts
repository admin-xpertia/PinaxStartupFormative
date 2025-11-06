import { Injectable, Logger } from '@nestjs/common';
import { IProgramRepository } from '../../../domain/program-design/repositories/IProgramRepository';
import { Programa } from '../../../domain/program-design/entities/Programa';
import { Fase } from '../../../domain/program-design/entities/Fase';
import { ProofPoint } from '../../../domain/program-design/entities/ProofPoint';
import { FaseDocumentation } from '../../../domain/program-design/entities/FaseDocumentation';
import { RecordId } from '../../../domain/shared/value-objects/RecordId';
import { ProgramStatus } from '../../../domain/program-design/value-objects/ProgramStatus';
import { SurrealDbService } from '../../../core/database/surrealdb.service';
import { ProgramMapper } from '../../mappers/ProgramMapper';

/**
 * ProgramRepository
 * Concrete implementation of IProgramRepository using SurrealDB
 */
@Injectable()
export class ProgramRepository implements IProgramRepository {
  private readonly logger = new Logger(ProgramRepository.name);

  constructor(
    private readonly db: SurrealDbService,
    private readonly mapper: ProgramMapper,
  ) {}

  /**
   * Finds a program by ID
   */
  async findById(id: RecordId): Promise<Programa | null> {
    try {
      const result = await this.db.select<any>(id.toString());

      if (!result || result.length === 0) {
        return null;
      }

      return this.mapper.programaToDomain(result[0]);
    } catch (error) {
      this.logger.error(`Error finding program by id: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds all programs
   */
  async findAll(criteria?: any): Promise<Programa[]> {
    try {
      const result = await this.db.select<any>('programa');
      return result.map((raw) => this.mapper.programaToDomain(raw));
    } catch (error) {
      this.logger.error('Error finding all programs', error);
      throw error;
    }
  }

  /**
   * Saves a program (insert or update)
   */
  async save(programa: Programa): Promise<Programa> {
    try {
      const data = this.mapper.programaToPersistence(programa);
      const id = programa.getId().toString();

      // Check if exists
      const exists = await this.exists(programa.getId());

      if (exists) {
        // Update existing
        await this.db.update(id, data);
      } else {
        // Create new
        await this.db.create(id, data);
      }

      // Return the saved program
      const saved = await this.findById(programa.getId());
      return saved!;
    } catch (error) {
      this.logger.error(`Error saving program: ${programa.getId().toString()}`, error);
      throw error;
    }
  }

  /**
   * Deletes a program by ID
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
      this.logger.error(`Error deleting program: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Checks if a program exists
   */
  async exists(id: RecordId): Promise<boolean> {
    try {
      const result = await this.findById(id);
      return result !== null;
    } catch (error) {
      this.logger.error(`Error checking if program exists: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds all programs created by a specific instructor
   */
  async findByCreador(creadorId: RecordId): Promise<Programa[]> {
    try {
      const query = `
        SELECT * FROM programa
        WHERE creador = $creador
        ORDER BY created_at DESC
      `;

      const result = await this.db.query<any[]>(query, {
        creador: creadorId.toString(),
      });

      return result.map((raw) => this.mapper.programaToDomain(raw));
    } catch (error) {
      this.logger.error(`Error finding programs by creator: ${creadorId.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds programs by status
   */
  async findByStatus(status: ProgramStatus): Promise<Programa[]> {
    try {
      const query = `
        SELECT * FROM programa
        WHERE estado = $estado
        ORDER BY created_at DESC
      `;

      const result = await this.db.query<any[]>(query, {
        estado: status.getValue(),
      });

      return result.map((raw) => this.mapper.programaToDomain(raw));
    } catch (error) {
      this.logger.error(`Error finding programs by status: ${status.getValue()}`, error);
      throw error;
    }
  }

  /**
   * Finds a program with its complete structure (fases and proof points)
   */
  async findWithFullStructure(id: RecordId): Promise<{
    programa: Programa;
    fases: Fase[];
    proofPoints: ProofPoint[];
    documentation: Map<RecordId, FaseDocumentation>;
  } | null> {
    try {
      // First get the program
      const programa = await this.findById(id);
      if (!programa) {
        return null;
      }

      // Get all fases for this program
      const fasesQuery = `
        SELECT * FROM fase
        WHERE programa = $programaId
        ORDER BY orden ASC
      `;
      const fasesResult = await this.db.query<any[]>(fasesQuery, {
        programaId: id.toString(),
      });
      const fases = fasesResult.map((raw) => this.mapper.faseToDomain(raw));

      // Get all proof points for these fases
      const faseIds = fases.map((f) => f.getId().toString());

      let proofPoints: ProofPoint[] = [];
      if (faseIds.length > 0) {
        const ppQuery = `
          SELECT * FROM proof_point
          WHERE fase IN [$faseIds]
          ORDER BY orden_en_fase ASC
        `;
        const ppResult = await this.db.query<any[]>(ppQuery, {
          faseIds: faseIds,
        });
        proofPoints = ppResult.map((raw) => this.mapper.proofPointToDomain(raw));
      }

      // Get documentation for all fases
      const documentation = new Map<RecordId, FaseDocumentation>();
      // TODO: Implement when FaseDocumentationRepository is ready

      return {
        programa,
        fases,
        proofPoints,
        documentation,
      };
    } catch (error) {
      this.logger.error(`Error finding program with full structure: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Saves a program with its complete structure
   */
  async saveWithStructure(
    programa: Programa,
    fases?: Fase[],
    proofPoints?: ProofPoint[],
  ): Promise<void> {
    try {
      // Save the program first
      await this.save(programa);

      // Save fases if provided
      if (fases && fases.length > 0) {
        for (const fase of fases) {
          const faseData = this.mapper.faseToPersistence(fase);
          const faseId = fase.getId().toString();

          const exists = await this.db.select<any>(faseId);
          if (exists && exists.length > 0) {
            await this.db.update(faseId, faseData);
          } else {
            await this.db.create(faseId, faseData);
          }
        }
      }

      // Save proof points if provided
      if (proofPoints && proofPoints.length > 0) {
        for (const pp of proofPoints) {
          const ppData = this.mapper.proofPointToPersistence(pp);
          const ppId = pp.getId().toString();

          const exists = await this.db.select<any>(ppId);
          if (exists && exists.length > 0) {
            await this.db.update(ppId, ppData);
          } else {
            await this.db.create(ppId, ppData);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error saving program with structure: ${programa.getId().toString()}`, error);
      throw error;
    }
  }
}
