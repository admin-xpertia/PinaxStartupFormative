/**
 * Base class for Value Objects
 * Value Objects are defined by their attributes, not by their identity
 * They are immutable and can be replaced
 */
export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  /**
   * Checks if two value objects are equal based on their properties
   */
  abstract equals(vo?: ValueObject<T>): boolean;

  /**
   * Returns the properties of the value object
   */
  protected getProps(): T {
    return this.props;
  }
}
