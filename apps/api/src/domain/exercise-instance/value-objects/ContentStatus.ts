import { ValueObject } from '../../shared/types/ValueObject';

/**
 * ContentStatus Value Object
 * Represents the status of exercise content generation
 */
export type ContentStatusType = 'sin_generar' | 'generando' | 'draft' | 'publicado';

export class ContentStatus extends ValueObject<{ value: ContentStatusType }> {
  private constructor(value: ContentStatusType) {
    super({ value });
  }

  static create(value: ContentStatusType): ContentStatus {
    return new ContentStatus(value);
  }

  static sinGenerar(): ContentStatus {
    return new ContentStatus('sin_generar');
  }

  static generando(): ContentStatus {
    return new ContentStatus('generando');
  }

  static draft(): ContentStatus {
    return new ContentStatus('draft');
  }

  static publicado(): ContentStatus {
    return new ContentStatus('publicado');
  }

  getValue(): ContentStatusType {
    return this.props.value;
  }

  isSinGenerar(): boolean {
    return this.props.value === 'sin_generar';
  }

  isGenerando(): boolean {
    return this.props.value === 'generando';
  }

  isDraft(): boolean {
    return this.props.value === 'draft';
  }

  isPublicado(): boolean {
    return this.props.value === 'publicado';
  }

  canGenerate(): boolean {
    return this.props.value === 'sin_generar';
  }

  canEdit(): boolean {
    return this.props.value === 'draft';
  }

  canPublish(): boolean {
    return this.props.value === 'draft';
  }

  equals(vo?: ValueObject<{ value: ContentStatusType }>): boolean {
    if (!vo) return false;
    return this.props.value === (vo as ContentStatus).props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
