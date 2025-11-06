import { ValueObject } from '../../shared/types/ValueObject';

/**
 * ProgramStatus Value Object
 * Represents the lifecycle state of a program
 */
export type ProgramStatusType =
  | 'draft'
  | 'borrador'
  | 'revision'
  | 'publicado'
  | 'archivado';

export class ProgramStatus extends ValueObject<{ value: ProgramStatusType }> {
  private constructor(value: ProgramStatusType) {
    super({ value });
  }

  static create(value: ProgramStatusType): ProgramStatus {
    return new ProgramStatus(value);
  }

  static draft(): ProgramStatus {
    return new ProgramStatus('draft');
  }

  static published(): ProgramStatus {
    return new ProgramStatus('publicado');
  }

  static archived(): ProgramStatus {
    return new ProgramStatus('archivado');
  }

  getValue(): ProgramStatusType {
    return this.props.value;
  }

  isDraft(): boolean {
    return this.props.value === 'draft' || this.props.value === 'borrador';
  }

  isPublished(): boolean {
    return this.props.value === 'publicado';
  }

  isArchived(): boolean {
    return this.props.value === 'archivado';
  }

  canEdit(): boolean {
    return this.isDraft() || this.props.value === 'revision';
  }

  canPublish(): boolean {
    return this.isDraft() || this.props.value === 'revision';
  }

  equals(vo?: ValueObject<{ value: ProgramStatusType }>): boolean {
    if (!vo) return false;
    return this.props.value === (vo as ProgramStatus).props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
