import { ValueObject } from "../../shared/types/ValueObject";

export type EnrollmentStatusType =
  | "activo"
  | "completado"
  | "abandonado"
  | "suspendido";

export class EnrollmentStatus extends ValueObject<{
  value: EnrollmentStatusType;
}> {
  private constructor(value: EnrollmentStatusType) {
    super({ value });
  }

  static create(value: EnrollmentStatusType): EnrollmentStatus {
    return new EnrollmentStatus(value);
  }

  static active(): EnrollmentStatus {
    return new EnrollmentStatus("activo");
  }

  static completed(): EnrollmentStatus {
    return new EnrollmentStatus("completado");
  }

  static dropped(): EnrollmentStatus {
    return new EnrollmentStatus("abandonado");
  }

  static paused(): EnrollmentStatus {
    return new EnrollmentStatus("suspendido");
  }

  getValue(): EnrollmentStatusType {
    return this.props.value;
  }

  equals(vo?: ValueObject<{ value: EnrollmentStatusType }>): boolean {
    if (!vo) return false;
    return this.props.value === (vo as EnrollmentStatus).props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
