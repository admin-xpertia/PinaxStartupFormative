import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { SurrealDbService } from 'src/core/database';
import { CrearRubricaDto } from '../contenido/dto';
import { RubricaService } from '../contenido/rubrica.service';

@Injectable()
export class ComponentesService {
  private readonly logger = new Logger(ComponentesService.name);

  constructor(
    private readonly surrealDb: SurrealDbService,
    private readonly rubricaService: RubricaService,
  ) {}

  /**
   * Obtiene el contenido actual de un componente para mostrarlo en el editor.
   *
   * @param componenteId - ID del componente
   * @returns El contenido actual del componente
   */
  async getContenidoActual(componenteId: string) {
    // Obtenemos el ID del contenido actual desde el componente
    const query = `
      SELECT version_contenido_actual
      FROM type::thing("componente", $componenteId);
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      componenteId: this.extractId(componenteId),
    });

    const componente = result?.[0];

    if (!componente?.version_contenido_actual) {
      throw new NotFoundException(
        'Este componente aún no tiene contenido generado.',
      );
    }

    // Devolvemos el registro de contenido completo
    const queryContenido = `
      SELECT * FROM $contenidoId;
    `;

    const contenido = await this.surrealDb.query<any[]>(queryContenido, {
      contenidoId: componente.version_contenido_actual,
    });

    return contenido?.[0];
  }

  /**
   * Actualiza el contenido de un componente con versionamiento automático.
   *
   * LÓGICA DE VERSIONAMIENTO:
   * 1. Obtiene el contenido actual
   * 2. Crea un snapshot en 'version_contenido'
   * 3. Actualiza el contenido con los nuevos datos
   * 4. Marca el contenido como 'draft'
   *
   * Todo esto ocurre en una transacción de SurrealDB para garantizar atomicidad.
   *
   * @param componenteId - ID del componente
   * @param nuevoContenido - Nuevo contenido a guardar
   * @param userId - ID del usuario que realiza el cambio
   * @returns El contenido actualizado
   */
  async updateContenidoConVersionamiento(
    componenteId: string,
    nuevoContenido: Record<string, any>,
    userId: string,
  ) {
    const componenteIdClean = this.extractId(componenteId);
    const userIdClean = this.extractId(userId);

    // 1. Obtener el ID del contenido actual
    const query = `
      SELECT version_contenido_actual
      FROM type::thing("componente", $componenteId);
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      componenteId: componenteIdClean,
    });

    const componente = result?.[0];
    const contenidoActualId = componente?.version_contenido_actual;

    if (!contenidoActualId) {
      throw new NotFoundException(
        'No se puede actualizar un contenido que no existe.',
      );
    }

    // 2. Iniciar Transacción
    const transactionQuery = `
      BEGIN TRANSACTION;

      -- 3. Obtener el contenido actual para 'snapshotearlo'
      LET $contenidoActual = (SELECT * FROM ${contenidoActualId});

      -- 4. Obtener el último número de versión para este componente
      LET $ultimaVersion = (
        SELECT VALUE numero_version
        FROM version_contenido
        WHERE componente = type::thing("componente", "${componenteIdClean}")
        ORDER BY numero_version DESC
        LIMIT 1
      );

      -- 5. Crear el 'snapshot' en la tabla 'version_contenido'
      LET $nuevaVersion = CREATE version_contenido SET
        componente = type::thing("componente", "${componenteIdClean}"),
        numero_version = IF $ultimaVersion[0] != NONE THEN $ultimaVersion[0] + 1 ELSE 1 END,
        contenido_snapshot = $contenidoActual[0].contenido,
        cambios_descripcion = "Contenido editado por instructor",
        tipo_cambio = "patch",
        creado_por = type::thing("user", "${userIdClean}"),
        checksum = crypto::md5(string::join("", $contenidoActual[0].contenido));

      -- 6. AHORA SÍ, actualizar el registro de 'componente_contenido'
      LET $contenidoActualizado = UPDATE ${contenidoActualId} SET
        contenido = ${JSON.stringify(nuevoContenido)},
        estado = 'draft';

      COMMIT TRANSACTION;

      -- Devolver el contenido actualizado
      RETURN $contenidoActualizado;
    `;

    try {
      const txResult = await this.surrealDb.query<any[]>(transactionQuery);

      // El resultado está en el último elemento
      const contenidoActualizado = txResult[txResult.length - 1];

      this.logger.log(
        `Contenido actualizado con versionamiento para componente ${componenteIdClean}`,
      );

      return contenidoActualizado;
    } catch (error) {
      this.logger.error('Falló la transacción de versionamiento:', error);
      throw new InternalServerErrorException('Error al guardar el contenido.');
    }
  }

  /**
   * Obtiene la rúbrica de un componente.
   * Delega al RubricaService.
   */
  async getRubrica(componenteId: string) {
    return this.rubricaService.obtenerRubrica(componenteId);
  }

  /**
   * Crea una nueva rúbrica para un componente.
   * Delega al RubricaService.
   */
  async createRubrica(dto: CrearRubricaDto) {
    return this.rubricaService.crearRubrica(dto);
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  private extractId(recordId: string): string {
    if (!recordId) {
      throw new BadRequestException('ID inválido');
    }

    const parts = recordId.split(':');
    return parts.length > 1 ? parts[parts.length - 1] : recordId;
  }
}
