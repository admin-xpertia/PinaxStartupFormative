import { ValueObject } from "../../shared/types/ValueObject";

export type CohortStatusType =
  | "planificado"
  | "activo"
  | "finalizado"
  | "archivado";

export class CohortStatus extends ValueObject<{ value: CohortStatusType }> {
  private constructor(value: CohortStatusType) {
    super({ value });
  }

  static create(value: CohortStatusType): CohortStatus {
    return new CohortStatus(value);
  }

  static planned(): CohortStatus {
    return new CohortStatus("planificado");
  }

  static active(): CohortStatus {
    return new CohortStatus("activo");
  }

  static finished(): CohortStatus {
    return new CohortStatus("finalizado");
  }

  static archived(): CohortStatus {
    return new CohortStatus("archivado");
  }

  getValue(): CohortStatusType {
    return this.props.value;
  }

  isActive(): boolean {
    return this.props.value === "activo";
  }

  equals(vo?: ValueObject<{ value: CohortStatusType }>): boolean {
    if (!vo) return false;
    return this.props.value === (vo as CohortStatus).props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
