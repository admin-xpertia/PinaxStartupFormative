import { Injectable, Logger } from '@nestjs/common';
import { IFaseRepository } from '../../../domain/program-design/repositories/IProgramRepository';
import { Fase } from '../../../domain/program-design/entities/Fase';
import { RecordId } from '../../../domain/shared/value-objects/RecordId';
import { SurrealDbService } from '../../../core/database/surrealdb.service';
import { ProgramMapper } from '../../mappers/ProgramMapper';

/**
 * FaseRepository
 * Concrete implementation of IFaseRepository using SurrealDB
 */
@Injectable()
export class FaseRepository implements IFaseRepository {
  private readonly logger = new Logger(FaseRepository.name);

  constructor(
    private readonly db: SurrealDbService,
    private readonly mapper: ProgramMapper,
  ) {}

  /**
   * Finds a fase by ID
   */
  async findById(id: RecordId): Promise<Fase | null> {
    try {
      const result = await this.db.select<any>(id.toString());

      if (!result || result.length === 0) {
        return null;
      }

      return this.mapper.faseToDomain(result[0]);
    } catch (error) {
      this.logger.error(`Error finding fase by id: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds all fases
   */
  async findAll(criteria?: any): Promise<Fase[]> {
    try {
      const result = await this.db.select<any>('fase');
      return result.map((raw) => this.mapper.faseToDomain(raw));
    } catch (error) {
      this.logger.error('Error finding all fases', error);
      throw error;
    }
  }

  /**
   * Saves a fase (insert or update)
   */
  async save(fase: Fase): Promise<Fase> {
    try {
      const data = this.mapper.faseToPersistence(fase);
      const id = fase.getId().toString();

      // Check if exists
      const exists = await this.exists(fase.getId());

      if (exists) {
        // Update existing
        await this.db.update(id, data);
      } else {
        // Create new
        await this.db.create(id, data);
      }

      // Return the saved fase
      const saved = await this.findById(fase.getId());
      return saved!;
    } catch (error) {
      this.logger.error(`Error saving fase: ${fase.getId().toString()}`, error);
      throw error;
    }
  }

  /**
   * Deletes a fase by ID
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
      this.logger.error(`Error deleting fase: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Checks if a fase exists
   */
  async exists(id: RecordId): Promise<boolean> {
    try {
      const result = await this.findById(id);
      return result !== null;
    } catch (error) {
      this.logger.error(`Error checking if fase exists: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds all fases for a program
   */
  async findByPrograma(programaId: RecordId): Promise<Fase[]> {
    try {
      const query = `
        SELECT * FROM fase
        WHERE programa = $programaId
        ORDER BY orden ASC
      `;

      const result = await this.db.query<any[]>(query, {
        programaId: programaId.toString(),
      });

      return result.map((raw) => this.mapper.faseToDomain(raw));
    } catch (error) {
      this.logger.error(`Error finding fases by programa: ${programaId.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds a fase by its number within a program
   */
  async findByNumeroFase(programaId: RecordId, numeroFase: number): Promise<Fase | null> {
    try {
      const query = `
        SELECT * FROM fase
        WHERE programa = $programaId AND numero_fase = $numeroFase
        LIMIT 1
      `;

      const result = await this.db.query<any[]>(query, {
        programaId: programaId.toString(),
        numeroFase,
      });

      if (result.length === 0) {
        return null;
      }

      return this.mapper.faseToDomain(result[0]);
    } catch (error) {
      this.logger.error(
        `Error finding fase by numero: ${programaId.toString()}, ${numeroFase}`,
        error,
      );
      throw error;
    }
  }

  /**
   * Reorders fases within a program
   */
  async reorder(programaId: RecordId, faseOrders: Map<RecordId, number>): Promise<void> {
    try {
      // Update each fase with its new order
      for (const [faseId, newOrder] of faseOrders.entries()) {
        const query = `
          UPDATE $faseId SET orden = $orden, updated_at = time::now()
        `;

        await this.db.query(query, {
          faseId: faseId.toString(),
          orden: newOrder,
        });
      }
    } catch (error) {
      this.logger.error(`Error reordering fases for programa: ${programaId.toString()}`, error);
      throw error;
    }
  }
}
