import { Entity } from "../../shared/types/Entity";
import { RecordId } from "../../shared/value-objects/RecordId";
import { Timestamp } from "../../shared/value-objects/Timestamp";

/**
 * FaseDocumentation Entity
 * Represents extended documentation for a fase
 * Used to provide context for AI-generated content
 */

export interface ConceptoClave {
  nombre: string;
  definicion: string;
  importancia?: string;
}

export interface CasoEjemplo {
  titulo: string;
  descripcion: string;
  resultado?: string;
}

export interface ErrorComun {
  descripcion: string;
  solucion?: string;
}

export interface RecursoReferencia {
  tipo: "articulo" | "video" | "libro" | "herramienta" | "otro";
  titulo: string;
  url?: string;
  descripcion?: string;
}

export interface FaseDocumentationProps {
  fase: RecordId;
  contextoGeneral?: string;
  conceptosClave: ConceptoClave[];
  casosEjemplo: CasoEjemplo[];
  erroresComunes: ErrorComun[];
  recursosReferencia: RecursoReferencia[];
  criteriosEvaluacion: Record<string, any>;
  updatedAt: Timestamp;
}

export class FaseDocumentation extends Entity<FaseDocumentationProps> {
  private constructor(id: RecordId, props: FaseDocumentationProps) {
    super(id, props);
  }

  /**
   * Creates new FaseDocumentation (Factory method)
   */
  static create(faseId: RecordId, id?: RecordId): FaseDocumentation {
    const docId =
      id ||
      RecordId.create("fase_documentation", `${Date.now()}_${Math.random()}`);

    const documentation = new FaseDocumentation(docId, {
      fase: faseId,
      conceptosClave: [],
      casosEjemplo: [],
      erroresComunes: [],
      recursosReferencia: [],
      criteriosEvaluacion: {},
      updatedAt: Timestamp.now(),
    });

    return documentation;
  }

  /**
   * Reconstitutes FaseDocumentation from persistence
   */
  static reconstitute(
    id: RecordId,
    props: FaseDocumentationProps,
  ): FaseDocumentation {
    return new FaseDocumentation(id, props);
  }

  // ========== Getters ==========

  getFase(): RecordId {
    return this.props.fase;
  }

  getContextoGeneral(): string | undefined {
    return this.props.contextoGeneral;
  }

  getConceptosClave(): ConceptoClave[] {
    return [...this.props.conceptosClave];
  }

  getCasosEjemplo(): CasoEjemplo[] {
    return [...this.props.casosEjemplo];
  }

  getErroresComunes(): ErrorComun[] {
    return [...this.props.erroresComunes];
  }

  getRecursosReferencia(): RecursoReferencia[] {
    return [...this.props.recursosReferencia];
  }

  getCriteriosEvaluacion(): Record<string, any> {
    return { ...this.props.criteriosEvaluacion };
  }

  // ========== Business Methods ==========

  /**
   * Updates the general context
   */
  updateContextoGeneral(contexto: string): void {
    this.props.contextoGeneral = contexto;
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Adds a key concept
   */
  addConceptoClave(concepto: ConceptoClave): void {
    if (!concepto.nombre || !concepto.definicion) {
      throw new Error("Concepto must have nombre and definicion");
    }

    this.props.conceptosClave.push(concepto);
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Removes a key concept by name
   */
  removeConceptoClave(nombre: string): void {
    const index = this.props.conceptosClave.findIndex(
      (c) => c.nombre === nombre,
    );
    if (index > -1) {
      this.props.conceptosClave.splice(index, 1);
      this.props.updatedAt = Timestamp.now();
    }
  }

  /**
   * Updates all key concepts
   */
  updateConceptosClave(conceptos: ConceptoClave[]): void {
    this.props.conceptosClave = [...conceptos];
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Adds an example case
   */
  addCasoEjemplo(caso: CasoEjemplo): void {
    if (!caso.titulo || !caso.descripcion) {
      throw new Error("Caso must have titulo and descripcion");
    }

    this.props.casosEjemplo.push(caso);
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Removes an example case by title
   */
  removeCasoEjemplo(titulo: string): void {
    const index = this.props.casosEjemplo.findIndex((c) => c.titulo === titulo);
    if (index > -1) {
      this.props.casosEjemplo.splice(index, 1);
      this.props.updatedAt = Timestamp.now();
    }
  }

  /**
   * Updates all example cases
   */
  updateCasosEjemplo(casos: CasoEjemplo[]): void {
    this.props.casosEjemplo = [...casos];
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Adds a common error
   */
  addErrorComun(error: ErrorComun): void {
    if (!error.descripcion) {
      throw new Error("Error must have descripcion");
    }

    this.props.erroresComunes.push(error);
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Removes a common error
   */
  removeErrorComun(descripcion: string): void {
    const index = this.props.erroresComunes.findIndex(
      (e) => e.descripcion === descripcion,
    );
    if (index > -1) {
      this.props.erroresComunes.splice(index, 1);
      this.props.updatedAt = Timestamp.now();
    }
  }

  /**
   * Updates all common errors
   */
  updateErroresComunes(errores: ErrorComun[]): void {
    this.props.erroresComunes = [...errores];
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Adds a reference resource
   */
  addRecursoReferencia(recurso: RecursoReferencia): void {
    if (!recurso.tipo || !recurso.titulo) {
      throw new Error("Recurso must have tipo and titulo");
    }

    this.props.recursosReferencia.push(recurso);
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Removes a reference resource by title
   */
  removeRecursoReferencia(titulo: string): void {
    const index = this.props.recursosReferencia.findIndex(
      (r) => r.titulo === titulo,
    );
    if (index > -1) {
      this.props.recursosReferencia.splice(index, 1);
      this.props.updatedAt = Timestamp.now();
    }
  }

  /**
   * Updates all reference resources
   */
  updateRecursosReferencia(recursos: RecursoReferencia[]): void {
    this.props.recursosReferencia = [...recursos];
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Updates evaluation criteria
   */
  updateCriteriosEvaluacion(criterios: Record<string, any>): void {
    this.props.criteriosEvaluacion = { ...criterios };
    this.props.updatedAt = Timestamp.now();
  }

  /**
   * Builds a comprehensive context string for AI generation
   */
  buildContextForAI(): string {
    const parts: string[] = [];

    if (this.props.contextoGeneral) {
      parts.push(`CONTEXTO GENERAL:\n${this.props.contextoGeneral}\n`);
    }

    if (this.props.conceptosClave.length > 0) {
      parts.push("CONCEPTOS CLAVE:");
      this.props.conceptosClave.forEach((concepto, i) => {
        parts.push(`${i + 1}. ${concepto.nombre}: ${concepto.definicion}`);
        if (concepto.importancia) {
          parts.push(`   Importancia: ${concepto.importancia}`);
        }
      });
      parts.push("");
    }

    if (this.props.casosEjemplo.length > 0) {
      parts.push("CASOS DE EJEMPLO:");
      this.props.casosEjemplo.forEach((caso, i) => {
        parts.push(`${i + 1}. ${caso.titulo}`);
        parts.push(`   ${caso.descripcion}`);
        if (caso.resultado) {
          parts.push(`   Resultado: ${caso.resultado}`);
        }
      });
      parts.push("");
    }

    if (this.props.erroresComunes.length > 0) {
      parts.push("ERRORES COMUNES A EVITAR:");
      this.props.erroresComunes.forEach((error, i) => {
        parts.push(`${i + 1}. ${error.descripcion}`);
        if (error.solucion) {
          parts.push(`   Solución: ${error.solucion}`);
        }
      });
      parts.push("");
    }

    return parts.join("\n");
  }

  // ========== Serialization ==========

  /**
   * Converts to a plain object for persistence
   * Note: updated_at is omitted - SurrealDB handles it automatically with DEFAULT time::now()
   */
  toPersistence(): any {
    return {
      id: this.getId().toString(),
      fase: this.props.fase.toString(),
      contexto_general: this.props.contextoGeneral,
      conceptos_clave: this.props.conceptosClave,
      casos_ejemplo: this.props.casosEjemplo,
      errores_comunes: this.props.erroresComunes,
      recursos_referencia: this.props.recursosReferencia,
      criterios_evaluacion: this.props.criteriosEvaluacion,
      // updated_at is handled by SurrealDB DEFAULT time::now()
    };
  }
}
