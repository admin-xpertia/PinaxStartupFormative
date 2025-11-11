/**
 * RecordId Value Object
 * Represents a SurrealDB record ID in the format "table:id"
 * Ensures type safety and validation for record IDs throughout the domain
 */

export class RecordId {
  private constructor(
    private readonly table: string,
    private readonly id: string,
  ) {
    this.validate();
  }

  /**
   * Creates a RecordId from a full record string (e.g., "programa:abc123")
   */
  static fromString(recordIdString: string): RecordId {
    if (!recordIdString || typeof recordIdString !== "string") {
      throw new Error("RecordId must be a non-empty string");
    }

    const parts = recordIdString.split(":");

    if (parts.length !== 2) {
      throw new Error(
        `Invalid RecordId format: "${recordIdString}". Expected "table:id"`,
      );
    }

    const [table, id] = parts;

    return new RecordId(table, id);
  }

  /**
   * Creates a RecordId from table name and ID
   */
  static create(table: string, id: string): RecordId {
    return new RecordId(table, id);
  }

  /**
   * Returns the full record ID string (e.g., "programa:abc123")
   */
  toString(): string {
    return `${this.table}:${this.id}`;
  }

  /**
   * Returns just the ID portion (e.g., "abc123")
   */
  getId(): string {
    return this.id;
  }

  /**
   * Returns just the table portion (e.g., "programa")
   */
  getTable(): string {
    return this.table;
  }

  /**
   * Checks if two RecordIds are equal
   */
  equals(other: RecordId): boolean {
    return this.table === other.table && this.id === other.id;
  }

  /**
   * Validates the RecordId
   */
  private validate(): void {
    if (!this.table || this.table.trim().length === 0) {
      throw new Error("RecordId table cannot be empty");
    }

    if (!this.id || this.id.trim().length === 0) {
      throw new Error("RecordId id cannot be empty");
    }

    // Validate table name format (alphanumeric and underscore only)
    if (!/^[a-z_][a-z0-9_]*$/i.test(this.table)) {
      throw new Error(
        `Invalid table name: "${this.table}". Must be alphanumeric with underscores`,
      );
    }
  }

  /**
   * Converts to JSON representation
   */
  toJSON(): string {
    return this.toString();
  }
}
