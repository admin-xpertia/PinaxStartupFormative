/**
 * Result Type - Represents the outcome of an operation
 * Inspired by Rust's Result<T, E> and functional programming patterns
 * Avoids throwing exceptions in domain logic
 */

export class Result<T, E = Error> {
  private constructor(
    private readonly isSuccess: boolean,
    private readonly value?: T,
    private readonly error?: E,
  ) {}

  /**
   * Creates a successful result
   */
  static ok<T, E = Error>(value: T): Result<T, E> {
    return new Result<T, E>(true, value, undefined);
  }

  /**
   * Creates a failed result
   */
  static fail<T, E = Error>(error: E): Result<T, E> {
    return new Result<T, E>(false, undefined, error);
  }

  /**
   * Checks if the result is successful
   */
  isOk(): boolean {
    return this.isSuccess;
  }

  /**
   * Checks if the result is a failure
   */
  isFail(): boolean {
    return !this.isSuccess;
  }

  /**
   * Returns the value if successful, throws if failed
   */
  getValue(): T {
    if (!this.isSuccess) {
      throw new Error("Cannot get value from failed result");
    }
    return this.value!;
  }

  /**
   * Returns the error if failed, throws if successful
   */
  getError(): E {
    if (this.isSuccess) {
      throw new Error("Cannot get error from successful result");
    }
    return this.error!;
  }

  /**
   * Returns the value if successful, otherwise returns the default value
   */
  getValueOr(defaultValue: T): T {
    return this.isSuccess ? this.value! : defaultValue;
  }

  /**
   * Maps the value if successful, otherwise returns the failed result
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isSuccess) {
      return Result.ok(fn(this.value!));
    }
    return Result.fail(this.error!);
  }

  /**
   * FlatMaps the value if successful, otherwise returns the failed result
   */
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    if (this.isSuccess) {
      return fn(this.value!);
    }
    return Result.fail(this.error!);
  }

  /**
   * Maps the error if failed, otherwise returns the successful result
   */
  mapError<F>(fn: (error: E) => F): Result<T, F> {
    if (this.isFail()) {
      return Result.fail(fn(this.error!));
    }
    return Result.ok(this.value!);
  }

  /**
   * Executes a callback if successful
   */
  onOk(fn: (value: T) => void): Result<T, E> {
    if (this.isSuccess) {
      fn(this.value!);
    }
    return this;
  }

  /**
   * Executes a callback if failed
   */
  onFail(fn: (error: E) => void): Result<T, E> {
    if (this.isFail()) {
      fn(this.error!);
    }
    return this;
  }

  /**
   * Pattern matching for Result
   */
  match<U>(patterns: { ok: (value: T) => U; fail: (error: E) => U }): U {
    if (this.isSuccess) {
      return patterns.ok(this.value!);
    }
    return patterns.fail(this.error!);
  }
}

/**
 * Convenience type for Results that don't return a value
 */
export type VoidResult<E = Error> = Result<void, E>;

/**
 * Combines multiple Results into a single Result
 * If all are successful, returns ok with an array of values
 * If any fail, returns the first failure
 */
export function combineResults<T, E = Error>(
  results: Result<T, E>[],
): Result<T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (result.isFail()) {
      return Result.fail(result.getError());
    }
    values.push(result.getValue());
  }

  return Result.ok(values);
}
