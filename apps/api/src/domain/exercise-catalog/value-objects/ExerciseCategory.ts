import { ValueObject } from "../../shared/types/ValueObject";

/**
 * ExerciseCategory Value Object
 * Represents the 12 types of AI-mediated exercises
 */
export type ExerciseCategoryType =
  | "leccion_interactiva"
  | "cuaderno_trabajo"
  | "simulacion_interaccion"
  | "mentor_asesor_ia"
  | "herramienta_analisis"
  | "herramienta_creacion"
  | "sistema_tracking"
  | "herramienta_revision"
  | "simulador_entorno"
  | "sistema_progresion"
  | "caso"
  | "instrucciones"
  | "metacognicion";

export class ExerciseCategory extends ValueObject<{
  value: ExerciseCategoryType;
}> {
  private constructor(value: ExerciseCategoryType) {
    super({ value });
  }

  static create(value: ExerciseCategoryType): ExerciseCategory {
    return new ExerciseCategory(value);
  }

  static leccionInteractiva(): ExerciseCategory {
    return new ExerciseCategory("leccion_interactiva");
  }

  static cuadernoTrabajo(): ExerciseCategory {
    return new ExerciseCategory("cuaderno_trabajo");
  }

  static simulacionInteraccion(): ExerciseCategory {
    return new ExerciseCategory("simulacion_interaccion");
  }

  static mentorAsesorIA(): ExerciseCategory {
    return new ExerciseCategory("mentor_asesor_ia");
  }

  static herramientaAnalisis(): ExerciseCategory {
    return new ExerciseCategory("herramienta_analisis");
  }

  static herramientaCreacion(): ExerciseCategory {
    return new ExerciseCategory("herramienta_creacion");
  }

  static sistemaTracking(): ExerciseCategory {
    return new ExerciseCategory("sistema_tracking");
  }

  static herramientaRevision(): ExerciseCategory {
    return new ExerciseCategory("herramienta_revision");
  }

  static simuladorEntorno(): ExerciseCategory {
    return new ExerciseCategory("simulador_entorno");
  }

  static sistemaProgresion(): ExerciseCategory {
    return new ExerciseCategory("sistema_progresion");
  }

  static casoAnalisis(): ExerciseCategory {
    return new ExerciseCategory("caso");
  }

  static instruccionesActividad(): ExerciseCategory {
    return new ExerciseCategory("instrucciones");
  }

  static metacognicion(): ExerciseCategory {
    return new ExerciseCategory("metacognicion");
  }

  getValue(): ExerciseCategoryType {
    return this.props.value;
  }

  /**
   * Returns a human-readable name for the category
   */
  getDisplayName(): string {
    const names: Record<ExerciseCategoryType, string> = {
      leccion_interactiva: "Lección Interactiva",
      cuaderno_trabajo: "Cuaderno de Trabajo",
      simulacion_interaccion: "Simulación de Interacción",
      mentor_asesor_ia: "Mentor/Asesor IA",
      herramienta_analisis: "Herramienta de Análisis",
      herramienta_creacion: "Herramienta de Creación",
      sistema_tracking: "Sistema de Tracking",
      herramienta_revision: "Herramienta de Revisión",
      simulador_entorno: "Simulador de Entorno",
      sistema_progresion: "Sistema de Progresión",
      caso: "Caso de Análisis",
      instrucciones: "Instrucciones de Actividad",
      metacognicion: "Metacognición",
    };

    return names[this.props.value];
  }

  /**
   * Returns the default icon for this category
   */
  getDefaultIcon(): string {
    const icons: Record<ExerciseCategoryType, string> = {
      leccion_interactiva: "📖",
      cuaderno_trabajo: "📝",
      simulacion_interaccion: "💬",
      mentor_asesor_ia: "🤖",
      herramienta_analisis: "🔍",
      herramienta_creacion: "🎨",
      sistema_tracking: "📊",
      herramienta_revision: "✅",
      simulador_entorno: "🌐",
      sistema_progresion: "🎯",
      caso: "⚖️",
      instrucciones: "📋",
      metacognicion: "🧠",
    };

    return icons[this.props.value];
  }

  equals(vo?: ValueObject<{ value: ExerciseCategoryType }>): boolean {
    if (!vo) return false;
    return this.props.value === (vo as ExerciseCategory).props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
