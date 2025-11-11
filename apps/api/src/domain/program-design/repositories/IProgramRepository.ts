import { IRepository } from "../../shared/repositories/IRepository";
import { Programa } from "../entities/Programa";
import { Fase } from "../entities/Fase";
import { ProofPoint } from "../entities/ProofPoint";
import { FaseDocumentation } from "../entities/FaseDocumentation";
import { RecordId } from "../../shared/value-objects/RecordId";
import { ProgramStatus } from "../value-objects/ProgramStatus";

/**
 * IProgramRepository
 * Repository interface for Program Design aggregate
 */
export interface IProgramRepository extends IRepository<Programa> {
  /**
   * Finds all programs created by a specific instructor
   */
  findByCreador(creadorId: RecordId): Promise<Programa[]>;

  /**
   * Finds programs by status
   */
  findByStatus(status: ProgramStatus): Promise<Programa[]>;

  /**
   * Finds a program with its complete structure (fases and proof points)
   */
  findWithFullStructure(id: RecordId): Promise<{
    programa: Programa;
    fases: Fase[];
    proofPoints: ProofPoint[];
    documentation: Map<RecordId, FaseDocumentation>;
  } | null>;

  /**
   * Saves a program with its complete structure
   */
  saveWithStructure(
    programa: Programa,
    fases?: Fase[],
    proofPoints?: ProofPoint[],
  ): Promise<void>;
}

/**
 * IFaseRepository
 * Repository interface for Fase entity
 */
export interface IFaseRepository extends IRepository<Fase> {
  /**
   * Finds all fases for a program
   */
  findByPrograma(programaId: RecordId): Promise<Fase[]>;

  /**
   * Finds a fase by its number within a program
   */
  findByNumeroFase(
    programaId: RecordId,
    numeroFase: number,
  ): Promise<Fase | null>;

  /**
   * Reorders fases within a program
   */
  reorder(
    programaId: RecordId,
    faseOrders: Map<RecordId, number>,
  ): Promise<void>;
}

/**
 * IProofPointRepository
 * Repository interface for ProofPoint entity
 */
export interface IProofPointRepository extends IRepository<ProofPoint> {
  /**
   * Finds all proof points for a fase
   */
  findByFase(faseId: RecordId): Promise<ProofPoint[]>;

  /**
   * Finds a proof point by its slug
   */
  findBySlug(slug: string): Promise<ProofPoint | null>;

  /**
   * Finds proof points with their prerequisites
   */
  findWithPrerequisites(id: RecordId): Promise<{
    proofPoint: ProofPoint;
    prerequisites: ProofPoint[];
  } | null>;

  /**
   * Finds all proof points that depend on a given proof point
   */
  findDependents(proofPointId: RecordId): Promise<ProofPoint[]>;

  /**
   * Reorders proof points within a fase
   */
  reorder(faseId: RecordId, ppOrders: Map<RecordId, number>): Promise<void>;
}

/**
 * IFaseDocumentationRepository
 * Repository interface for FaseDocumentation entity
 */
export interface IFaseDocumentationRepository
  extends IRepository<FaseDocumentation> {
  /**
   * Finds documentation for a specific fase
   */
  findByFase(faseId: RecordId): Promise<FaseDocumentation | null>;

  /**
   * Finds all documentation for a program
   */
  findByPrograma(programaId: RecordId): Promise<FaseDocumentation[]>;
}
