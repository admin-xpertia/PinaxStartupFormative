import { Injectable, Logger } from '@nestjs/common';
import { IProofPointRepository } from '../../../domain/program-design/repositories/IProgramRepository';
import { ProofPoint } from '../../../domain/program-design/entities/ProofPoint';
import { RecordId } from '../../../domain/shared/value-objects/RecordId';
import { SurrealDbService } from '../../../core/database/surrealdb.service';
import { ProgramMapper } from '../../mappers/ProgramMapper';

/**
 * ProofPointRepository
 * Concrete implementation of IProofPointRepository using SurrealDB
 */
@Injectable()
export class ProofPointRepository implements IProofPointRepository {
  private readonly logger = new Logger(ProofPointRepository.name);

  constructor(
    private readonly db: SurrealDbService,
    private readonly mapper: ProgramMapper,
  ) {}

  /**
   * Finds a proof point by ID
   */
  async findById(id: RecordId): Promise<ProofPoint | null> {
    try {
      const result = await this.db.select<any>(id.toString());

      if (!result || result.length === 0) {
        return null;
      }

      return this.mapper.proofPointToDomain(result[0]);
    } catch (error) {
      this.logger.error(`Error finding proof point by id: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds all proof points
   */
  async findAll(criteria?: any): Promise<ProofPoint[]> {
    try {
      const result = await this.db.select<any>('proof_point');
      return result.map((raw) => this.mapper.proofPointToDomain(raw));
    } catch (error) {
      this.logger.error('Error finding all proof points', error);
      throw error;
    }
  }

  /**
   * Saves a proof point (insert or update)
   */
  async save(proofPoint: ProofPoint): Promise<ProofPoint> {
    try {
      const data = this.mapper.proofPointToPersistence(proofPoint);
      const id = proofPoint.getId().toString();

      // Check if exists
      const exists = await this.exists(proofPoint.getId());

      if (exists) {
        // Update existing
        await this.db.update(id, data);
      } else {
        // Create new
        await this.db.create(id, data);
      }

      // Return the saved proof point
      const saved = await this.findById(proofPoint.getId());
      return saved!;
    } catch (error) {
      this.logger.error(`Error saving proof point: ${proofPoint.getId().toString()}`, error);
      throw error;
    }
  }

  /**
   * Deletes a proof point by ID
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
      this.logger.error(`Error deleting proof point: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Checks if a proof point exists
   */
  async exists(id: RecordId): Promise<boolean> {
    try {
      const result = await this.findById(id);
      return result !== null;
    } catch (error) {
      this.logger.error(`Error checking if proof point exists: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds all proof points for a fase
   */
  async findByFase(faseId: RecordId): Promise<ProofPoint[]> {
    try {
      const query = `
        SELECT * FROM proof_point
        WHERE fase = $faseId
        ORDER BY orden_en_fase ASC
      `;

      const result = await this.db.query<any[]>(query, {
        faseId: faseId.toString(),
      });

      return result.map((raw) => this.mapper.proofPointToDomain(raw));
    } catch (error) {
      this.logger.error(`Error finding proof points by fase: ${faseId.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds a proof point by its slug
   */
  async findBySlug(slug: string): Promise<ProofPoint | null> {
    try {
      const query = `
        SELECT * FROM proof_point
        WHERE slug = $slug
        LIMIT 1
      `;

      const result = await this.db.query<any[]>(query, { slug });

      if (result.length === 0) {
        return null;
      }

      return this.mapper.proofPointToDomain(result[0]);
    } catch (error) {
      this.logger.error(`Error finding proof point by slug: ${slug}`, error);
      throw error;
    }
  }

  /**
   * Finds proof points with their prerequisites
   */
  async findWithPrerequisites(id: RecordId): Promise<{
    proofPoint: ProofPoint;
    prerequisites: ProofPoint[];
  } | null> {
    try {
      const proofPoint = await this.findById(id);
      if (!proofPoint) {
        return null;
      }

      const prerequisiteIds = proofPoint.getPrerequisitos();
      const prerequisites: ProofPoint[] = [];

      // Fetch each prerequisite
      for (const prereqId of prerequisiteIds) {
        const prereq = await this.findById(prereqId);
        if (prereq) {
          prerequisites.push(prereq);
        }
      }

      return {
        proofPoint,
        prerequisites,
      };
    } catch (error) {
      this.logger.error(`Error finding proof point with prerequisites: ${id.toString()}`, error);
      throw error;
    }
  }

  /**
   * Finds all proof points that depend on a given proof point
   */
  async findDependents(proofPointId: RecordId): Promise<ProofPoint[]> {
    try {
      const query = `
        SELECT * FROM proof_point
        WHERE $proofPointId IN prerequisitos
      `;

      const result = await this.db.query<any[]>(query, {
        proofPointId: proofPointId.toString(),
      });

      return result.map((raw) => this.mapper.proofPointToDomain(raw));
    } catch (error) {
      this.logger.error(`Error finding dependent proof points: ${proofPointId.toString()}`, error);
      throw error;
    }
  }

  /**
   * Reorders proof points within a fase
   */
  async reorder(faseId: RecordId, ppOrders: Map<RecordId, number>): Promise<void> {
    try {
      // Update each proof point with its new order
      for (const [ppId, newOrder] of ppOrders.entries()) {
        const query = `
          UPDATE $ppId SET orden_en_fase = $orden, updated_at = time::now()
        `;

        await this.db.query(query, {
          ppId: ppId.toString(),
          orden: newOrder,
        });
      }
    } catch (error) {
      this.logger.error(`Error reordering proof points for fase: ${faseId.toString()}`, error);
      throw error;
    }
  }
}
