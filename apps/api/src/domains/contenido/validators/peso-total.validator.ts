import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Validador customizado que verifica que la suma de los pesos
 * de todas las dimensiones sea exactamente 100.
 *
 * Uso:
 * @Validate(PesoTotalValidator)
 */
@ValidatorConstraint({ name: 'pesoTotal', async: false })
export class PesoTotalValidator implements ValidatorConstraintInterface {
  validate(dimensiones: any[], args: ValidationArguments): boolean {
    if (!Array.isArray(dimensiones) || dimensiones.length === 0) {
      return false;
    }

    const sumaPesos = dimensiones.reduce((sum, dim) => {
      return sum + (typeof dim.peso === 'number' ? dim.peso : 0);
    }, 0);

    // Permitir un margen de error de 0.01 para evitar problemas de precisión de punto flotante
    const margenError = 0.01;
    return Math.abs(sumaPesos - 100) <= margenError;
  }

  defaultMessage(args: ValidationArguments): string {
    const dimensiones = args.value as any[];
    if (!Array.isArray(dimensiones)) {
      return 'Las dimensiones deben ser un array válido';
    }

    const sumaPesos = dimensiones.reduce((sum, dim) => {
      return sum + (typeof dim.peso === 'number' ? dim.peso : 0);
    }, 0);

    return `La suma de los pesos de las dimensiones debe ser 100. Suma actual: ${sumaPesos}`;
  }
}
