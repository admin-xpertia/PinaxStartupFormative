import { Injectable } from "@nestjs/common";
import { Programa } from "../../domain/program-design/entities/Programa";
import { Fase } from "../../domain/program-design/entities/Fase";
import { ProofPoint } from "../../domain/program-design/entities/ProofPoint";
import { FaseDocumentation } from "../../domain/program-design/entities/FaseDocumentation";
import { RecordId } from "../../domain/shared/value-objects/RecordId";
import { Timestamp } from "../../domain/shared/value-objects/Timestamp";
import { ProgramStatus } from "../../domain/program-design/value-objects/ProgramStatus";
import { Duration } from "../../domain/program-design/value-objects/Duration";
import { ProofPointSlug } from "../../domain/program-design/value-objects/ProofPointSlug";

/**
 * ProgramMapper
 * Maps between domain entities and database records for Program Design context
 */
@Injectable()
export class ProgramMapper {
  /**
   * Maps database record to Programa domain entity
   */
  programaToDomain(raw: any): Programa {
    const id = RecordId.fromString(raw.id);
    const creador = RecordId.fromString(raw.creador);

    return Programa.reconstitute(id, {
      nombre: raw.nombre,
      descripcion: raw.descripcion,
      duracion: Duration.weeks(raw.duracion_semanas),
      estado: ProgramStatus.create(raw.estado),
      versionActual: raw.version_actual,
      categoria: raw.categoria,
      nivelDificultad: raw.nivel_dificultad,
      imagenPortadaUrl: raw.imagen_portada_url,
      objetivosAprendizaje: raw.objetivos_aprendizaje,
      prerequisitos: raw.prerequisitos,
      audienciaObjetivo: raw.audiencia_objetivo,
      tags: raw.tags,
      visible: raw.visible ?? true,
      creador,
      createdAt: Timestamp.fromISOString(raw.created_at),
      updatedAt: Timestamp.fromISOString(raw.updated_at),
    });
  }

  /**
   * Maps Programa domain entity to database record
   */
  programaToPersistence(programa: Programa): any {
    return programa.toPersistence();
  }

  /**
   * Maps database record to Fase domain entity
   */
  faseToDomain(raw: any): Fase {
    const id = RecordId.fromString(raw.id);
    const programa = RecordId.fromString(raw.programa);

    return Fase.reconstitute(id, {
      programa,
      numeroFase: raw.numero_fase,
      nombre: raw.nombre,
      descripcion: raw.descripcion,
      objetivosAprendizaje: raw.objetivos_aprendizaje || [],
      duracion: Duration.weeks(raw.duracion_semanas_estimada),
      orden: raw.orden,
      createdAt: Timestamp.fromISOString(raw.created_at),
      updatedAt: Timestamp.fromISOString(raw.updated_at),
    });
  }

  /**
   * Maps Fase domain entity to database record
   */
  faseToPersistence(fase: Fase): any {
    return fase.toPersistence();
  }

  /**
   * Maps database record to ProofPoint domain entity
   */
  proofPointToDomain(raw: any): ProofPoint {
    const id = RecordId.fromString(raw.id);
    const fase = RecordId.fromString(raw.fase);
    const slug = ProofPointSlug.create(raw.slug);

    // Map prerequisitos from array of strings to RecordIds
    const prerequisitos = (raw.prerequisitos || []).map((p: string) =>
      RecordId.fromString(p),
    );

    return ProofPoint.reconstitute(id, {
      fase,
      nombre: raw.nombre,
      slug,
      descripcion: raw.descripcion,
      preguntaCentral: raw.pregunta_central,
      ordenEnFase: raw.orden_en_fase,
      duracion: Duration.hours(raw.duracion_estimada_horas),
      tipoEntregableFinal: raw.tipo_entregable_final,
      documentacionContexto: raw.documentacion_contexto || "",
      prerequisitos,
      createdAt: Timestamp.fromISOString(raw.created_at),
      updatedAt: Timestamp.fromISOString(raw.updated_at),
    });
  }

  /**
   * Maps ProofPoint domain entity to database record
   */
  proofPointToPersistence(proofPoint: ProofPoint): any {
    return proofPoint.toPersistence();
  }

  /**
   * Maps database record to FaseDocumentation domain entity
   */
  faseDocumentationToDomain(raw: any): FaseDocumentation {
    const id = RecordId.fromString(raw.id);
    const fase = RecordId.fromString(raw.fase);

    return FaseDocumentation.reconstitute(id, {
      fase,
      contextoGeneral: raw.contexto_general,
      conceptosClave: raw.conceptos_clave || [],
      casosEjemplo: raw.casos_ejemplo || [],
      erroresComunes: raw.errores_comunes || [],
      recursosReferencia: raw.recursos_referencia || [],
      criteriosEvaluacion: raw.criterios_evaluacion || {},
      updatedAt: Timestamp.fromISOString(raw.updated_at),
    });
  }

  /**
   * Maps FaseDocumentation domain entity to database record
   */
  faseDocumentationToPersistence(documentation: FaseDocumentation): any {
    return documentation.toPersistence();
  }
}
