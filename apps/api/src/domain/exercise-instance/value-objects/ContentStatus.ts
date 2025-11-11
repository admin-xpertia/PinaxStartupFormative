import { ValueObject } from "../../shared/types/ValueObject";

/**
 * ContentStatus Value Object
 * Represents the status of exercise content generation
 */
export type ContentStatusType =
  | "sin_generar"
  | "generando"
  | "generado"
  | "draft"
  | "publicado"
  | "error";

export class ContentStatus extends ValueObject<{ value: ContentStatusType }> {
  private constructor(value: ContentStatusType) {
    super({ value });
  }

  static create(value: ContentStatusType): ContentStatus {
    return new ContentStatus(value);
  }

  static sinGenerar(): ContentStatus {
    return new ContentStatus("sin_generar");
  }

  static generando(): ContentStatus {
    return new ContentStatus("generando");
  }

  static generado(): ContentStatus {
    return new ContentStatus("generado");
  }

  static draft(): ContentStatus {
    return new ContentStatus("draft");
  }

  static publicado(): ContentStatus {
    return new ContentStatus("publicado");
  }

  static error(): ContentStatus {
    return new ContentStatus("error");
  }

  getValue(): ContentStatusType {
    return this.props.value;
  }

  isSinGenerar(): boolean {
    return this.props.value === "sin_generar";
  }

  isGenerando(): boolean {
    return this.props.value === "generando";
  }

  isGenerado(): boolean {
    return this.props.value === "generado";
  }

  isDraft(): boolean {
    return this.props.value === "draft";
  }

  isPublicado(): boolean {
    return this.props.value === "publicado";
  }

  isError(): boolean {
    return this.props.value === "error";
  }

  canGenerate(): boolean {
    return this.props.value === "sin_generar" || this.props.value === "error";
  }

  canEdit(): boolean {
    return this.props.value === "draft" || this.props.value === "generado";
  }

  canPublish(): boolean {
    return this.props.value === "draft" || this.props.value === "generado";
  }

  equals(vo?: ValueObject<{ value: ContentStatusType }>): boolean {
    if (!vo) return false;
    return this.props.value === (vo as ContentStatus).props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
