import { Inject, Injectable, Logger } from "@nestjs/common";
import { RecordId } from "../../../domain/shared/value-objects/RecordId";
import {
  IProgramRepository,
  IFaseRepository,
  IProofPointRepository,
} from "../../../domain/program-design/repositories/IProgramRepository";
import { IExerciseInstanceRepository } from "../../../domain/exercise-instance/repositories/IExerciseInstanceRepository";
import { SurrealDbService } from "../../../core/database/surrealdb.service";
import type { ProgramStructure, ExerciseType } from "@xpertia/types/enrollment";
import { ProofPoint } from "../../../domain/program-design/entities/ProofPoint";
import { Fase } from "../../../domain/program-design/entities/Fase";

@Injectable()
export class ProgramSnapshotService {
  private readonly logger = new Logger(ProgramSnapshotService.name);
  private templateCategoryCache = new Map<
    string,
    { categoria: ExerciseType; nombre: string }
  >();

  constructor(
    @Inject("IProgramRepository")
    private readonly programRepository: IProgramRepository,
    @Inject("IFaseRepository")
    private readonly faseRepository: IFaseRepository,
    @Inject("IProofPointRepository")
    private readonly proofPointRepository: IProofPointRepository,
    @Inject("IExerciseInstanceRepository")
    private readonly exerciseInstanceRepository: IExerciseInstanceRepository,
    private readonly db: SurrealDbService,
  ) {}

  async createSnapshot(programId: RecordId): Promise<{
    snapshotId: RecordId;
    structure: ProgramStructure;
  }> {
    const programWithStructure =
      await this.programRepository.findWithFullStructure(programId);

    if (!programWithStructure) {
      throw new Error(`Program not found: ${programId.toString()}`);
    }

    const { programa, fases, proofPoints } = programWithStructure;
    const phasesStructure = await this.buildPhasesStructure(fases, proofPoints);

    const structure: ProgramStructure = {
      programId: programa.getId().toString(),
      programName: programa.getNombre(),
      phases: phasesStructure,
    };

    const snapshotInsert = await this.db.create("snapshot_programa", {
      programa_original: programa.getId().toString(),
      version: programa.getVersionActual().toString(),
      nombre: programa.getNombre(),
      descripcion: programa.getDescripcion() || "",
      instructor: programa.getCreador().toString(),
      duracion_semanas: programa.getDuracion().toWeeks(),
      objetivos_aprendizaje: programa.getObjetivosAprendizaje() || [],
      metadata: {
        structure,
        proofPoints: proofPoints.length,
        fases: fases.length,
      },
    });

    const snapshotRaw = Array.isArray(snapshotInsert)
      ? snapshotInsert[0]
      : snapshotInsert;
    const snapshotId = RecordId.fromString(snapshotRaw.id);

    return {
      snapshotId,
      structure,
    };
  }

  private async buildPhasesStructure(
    fases: Fase[],
    proofPoints: ProofPoint[],
  ): Promise<ProgramStructure["phases"]> {
    const phasesOrdered = [...fases].sort(
      (a, b) => a.getOrden() - b.getOrden(),
    );
    const proofPointsByFase = new Map<string, ProofPoint[]>();

    for (const proofPoint of proofPoints) {
      const key = proofPoint.getFase().toString();
      const current = proofPointsByFase.get(key) ?? [];
      current.push(proofPoint);
      proofPointsByFase.set(key, current);
    }

    const phasesStructure: ProgramStructure["phases"] = [];

    for (const fase of phasesOrdered) {
      const proofPointsForFase =
        proofPointsByFase.get(fase.getId().toString()) ?? [];
      const proofPointsStructure = [];

      const orderedProofPoints = proofPointsForFase.sort(
        (a, b) => a.getOrdenEnFase() - b.getOrdenEnFase(),
      );

      for (const proofPoint of orderedProofPoints) {
        const exercisesStructure =
          await this.buildExercisesStructure(proofPoint);

        proofPointsStructure.push({
          id: proofPoint.getId().toString(),
          nombre: proofPoint.getNombre(),
          slug: proofPoint.getSlug().toString(),
          descripcion: proofPoint.getDescripcion() || "",
          preguntaCentral: proofPoint.getPreguntaCentral() || "",
          orden: proofPoint.getOrdenEnFase(),
          status: "available" as const,
          progress: 0,
          exercises: exercisesStructure,
        });
      }

      phasesStructure.push({
        id: fase.getId().toString(),
        nombre: fase.getNombre(),
        descripcion: fase.getDescripcion() || "",
        orden: fase.getOrden(),
        duracionSemanas: fase.getDuracion().toWeeks(),
        proofPoints: proofPointsStructure,
      });
    }

    return phasesStructure;
  }

  private async buildExercisesStructure(
    proofPoint: ProofPoint,
  ): Promise<
    ProgramStructure["phases"][number]["proofPoints"][number]["exercises"]
  > {
    const exercises = await this.exerciseInstanceRepository.findByProofPoint(
      proofPoint.getId(),
    );

    const summaries = [];
    for (const exercise of exercises) {
      const templateMeta = await this.getTemplateMetadata(
        exercise.getTemplate(),
      );

      summaries.push({
        id: exercise.getId().toString(),
        nombre: exercise.getNombre(),
        tipo: templateMeta.categoria,
        orden: exercise.getOrden(),
        duracionEstimada: exercise.getDuracionEstimadaMinutos(),
        status: "available" as const,
        score: null,
        esObligatorio: exercise.isObligatorio(),
      });
    }

    return summaries;
  }

  private async getTemplateMetadata(templateId: RecordId): Promise<{
    categoria: ExerciseType;
    nombre: string;
  }> {
    const cacheKey = templateId.toString();
    if (this.templateCategoryCache.has(cacheKey)) {
      return this.templateCategoryCache.get(cacheKey)!;
    }

    const result = await this.db.select<any>(cacheKey);
    const raw = result?.[0];
    const categoria = this.normalizeCategory(raw?.categoria);
    const metadata = {
      categoria,
      nombre: raw?.nombre ?? "Ejercicio",
    };

    this.templateCategoryCache.set(cacheKey, metadata);
    return metadata;
  }

  private normalizeCategory(value?: string): ExerciseType {
    const normalized = value?.toLowerCase();
    const categoryMap: Record<string, ExerciseType> = {
      mentor_asesor_ia: "mentor_ia",
    };
    if (normalized && categoryMap[normalized]) {
      return categoryMap[normalized];
    }

    const allowed: ExerciseType[] = [
      "leccion_interactiva",
      "cuaderno_trabajo",
      "simulacion_interaccion",
      "mentor_ia",
      "herramienta_analisis",
      "herramienta_creacion",
      "sistema_tracking",
      "herramienta_revision",
      "simulador_entorno",
      "sistema_progresion",
      "caso",
      "instrucciones",
      "metacognicion",
    ];

    if (normalized && allowed.includes(normalized as ExerciseType)) {
      return normalized as ExerciseType;
    }

    return "leccion_interactiva";
  }
}
