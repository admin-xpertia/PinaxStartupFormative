import { ValueObject } from "../../shared/types/ValueObject";

/**
 * Duration Value Object
 * Represents a time duration with validation
 */
export class Duration extends ValueObject<{
  value: number;
  unit: "weeks" | "hours" | "days";
}> {
  private constructor(value: number, unit: "weeks" | "hours" | "days") {
    super({ value, unit });
    this.validate();
  }

  static weeks(value: number): Duration {
    return new Duration(value, "weeks");
  }

  static hours(value: number): Duration {
    return new Duration(value, "hours");
  }

  static days(value: number): Duration {
    return new Duration(value, "days");
  }

  getValue(): number {
    return this.props.value;
  }

  getUnit(): "weeks" | "hours" | "days" {
    return this.props.unit;
  }

  toWeeks(): number {
    switch (this.props.unit) {
      case "weeks":
        return this.props.value;
      case "days":
        return this.props.value / 7;
      case "hours":
        return this.props.value / (7 * 24);
    }
  }

  toHours(): number {
    switch (this.props.unit) {
      case "weeks":
        return this.props.value * 7 * 24;
      case "days":
        return this.props.value * 24;
      case "hours":
        return this.props.value;
    }
  }

  toDays(): number {
    switch (this.props.unit) {
      case "weeks":
        return this.props.value * 7;
      case "days":
        return this.props.value;
      case "hours":
        return this.props.value / 24;
    }
  }

  private validate(): void {
    if (this.props.value <= 0) {
      throw new Error("Duration must be greater than 0");
    }

    if (!Number.isFinite(this.props.value)) {
      throw new Error("Duration must be a finite number");
    }
  }

  equals(
    vo?: ValueObject<{ value: number; unit: "weeks" | "hours" | "days" }>,
  ): boolean {
    if (!vo) return false;
    const other = vo as Duration;
    // Compare in hours for accurate comparison across units
    return Math.abs(this.toHours() - other.toHours()) < 0.01;
  }

  toString(): string {
    return `${this.props.value} ${this.props.unit}`;
  }
}
