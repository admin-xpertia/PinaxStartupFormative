import { ValueObject } from "../../shared/types/ValueObject";

/**
 * ProofPointSlug Value Object
 * Represents a URL-safe slug for proof points
 * Example: "customer-startup-fit"
 */
export class ProofPointSlug extends ValueObject<{ value: string }> {
  private constructor(value: string) {
    super({ value });
    this.validate();
  }

  /**
   * Creates a slug from a string
   */
  static create(value: string): ProofPointSlug {
    return new ProofPointSlug(value);
  }

  /**
   * Creates a slug from a proof point name by slugifying it
   */
  static fromName(name: string): ProofPointSlug {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "") // Remove special chars
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .replace(/^-+/, "") // Remove leading hyphens
      .replace(/-+$/, ""); // Remove trailing hyphens

    return new ProofPointSlug(slug);
  }

  getValue(): string {
    return this.props.value;
  }

  private validate(): void {
    if (!this.props.value || this.props.value.trim().length === 0) {
      throw new Error("ProofPointSlug cannot be empty");
    }

    // Must be lowercase alphanumeric with hyphens only
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(this.props.value)) {
      throw new Error(
        "ProofPointSlug must be lowercase alphanumeric with hyphens only",
      );
    }

    if (this.props.value.length > 100) {
      throw new Error("ProofPointSlug cannot exceed 100 characters");
    }
  }

  equals(vo?: ValueObject<{ value: string }>): boolean {
    if (!vo) return false;
    return this.props.value === (vo as ProofPointSlug).props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
