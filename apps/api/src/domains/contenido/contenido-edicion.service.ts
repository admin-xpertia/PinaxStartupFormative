import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { SurrealDbService } from 'src/core/database';
import {
  EditarContenidoDto,
  PublicarContenidoDto,
  RestaurarVersionDto,
} from './dto';

@Injectable()
export class ContenidoEdicionService {
  private readonly logger = new Logger(ContenidoEdicionService.name);

  constructor(private readonly surrealDb: SurrealDbService) {}

  /**
   * Edita el contenido de un componente.
   *
   * LÓGICA DE VERSIONAMIENTO:
   * 1. Si el contenido actual está en estado 'draft', se sobrescribe directamente.
   * 2. Si el contenido actual está 'publicado', se crea un snapshot en version_contenido
   *    y luego se crea un nuevo registro en componente_contenido con estado 'draft'.
   *
   * Esta estrategia protege el contenido publicado mientras permite ediciones iterativas.
   */
  async editarContenido(dto: EditarContenidoDto, userId: string) {
    const { componenteId, contenido, cambiosDescripcion, tipoCambio } = dto;

    // 1. Obtener el componente y su contenido actual
    const componente = await this.obtenerComponente(componenteId);

    if (!componente) {
      throw new NotFoundException(`Componente ${componenteId} no encontrado`);
    }

    const contenidoActual = componente.version_contenido_actual
      ? await this.obtenerComponenteContenido(
          componente.version_contenido_actual,
        )
      : null;

    // 2. Determinar si necesitamos crear una versión
    const necesitaVersion = contenidoActual && contenidoActual.estado === 'publicado';

    if (necesitaVersion) {
      // Crear snapshot del contenido publicado
      await this.crearVersionSnapshot(componente, contenidoActual, userId, cambiosDescripcion || 'Edición manual', tipoCambio || 'patch');
    }

    // 3. Crear o actualizar el contenido
    let nuevoContenidoId: string;

    if (necesitaVersion || !contenidoActual) {
      // Crear nuevo registro de contenido en estado 'draft'
      nuevoContenidoId = await this.crearNuevoContenido(
        componenteId,
        componente.tipo,
        contenido,
      );
    } else {
      // Sobrescribir el contenido draft existente
      nuevoContenidoId = await this.actualizarContenido(
        contenidoActual.id,
        contenido,
      );
    }

    // 4. Actualizar el puntero del componente
    await this.actualizarVersionActual(componenteId, nuevoContenidoId);

    this.logger.log(
      `Contenido editado exitosamente para componente ${componenteId}. Version nueva: ${necesitaVersion}`,
    );

    return {
      componenteContenidoId: nuevoContenidoId,
      versionCreada: necesitaVersion,
      estado: 'draft',
    };
  }

  /**
   * Publica el contenido de un componente.
   * Cambia el estado de 'draft' a 'publicado'.
   *
   * IMPORTANTE: Una vez publicado, el contenido no se puede editar directamente.
   * Cualquier edición futura creará automáticamente una nueva versión.
   */
  async publicarContenido(dto: PublicarContenidoDto, userId: string) {
    const { componenteContenidoId } = dto;

    const contenido = await this.obtenerComponenteContenido(
      componenteContenidoId,
    );

    if (!contenido) {
      throw new NotFoundException(
        `ComponenteContenido ${componenteContenidoId} no encontrado`,
      );
    }

    if (contenido.estado === 'publicado') {
      throw new BadRequestException('Este contenido ya está publicado');
    }

    // Actualizar el estado a 'publicado'
    const query = `
      UPDATE type::thing("componente_contenido", $contenidoId)
      SET estado = 'publicado'
      RETURN *;
    `;

    await this.surrealDb.query(query, {
      contenidoId: this.extractId(componenteContenidoId),
    });

    this.logger.log(`Contenido ${componenteContenidoId} publicado exitosamente`);

    return {
      componenteContenidoId,
      estado: 'publicado',
      mensaje: 'Contenido publicado. Futuras ediciones crearán versiones.',
    };
  }

  /**
   * Restaura una versión anterior del contenido.
   * Crea un nuevo componente_contenido basado en el snapshot de la versión.
   */
  async restaurarVersion(dto: RestaurarVersionDto, userId: string) {
    const { componenteId, versionId, razon } = dto;

    // 1. Obtener la versión a restaurar
    const version = await this.obtenerVersion(versionId);

    if (!version) {
      throw new NotFoundException(`Versión ${versionId} no encontrada`);
    }

    // Verificar que la versión pertenece al componente correcto
    if (this.extractId(version.componente) !== this.extractId(componenteId)) {
      throw new BadRequestException(
        'La versión no pertenece a este componente',
      );
    }

    // 2. Crear nuevo contenido basado en el snapshot
    const nuevoContenidoId = await this.crearNuevoContenido(
      componenteId,
      version.contenido_snapshot.tipo,
      version.contenido_snapshot.contenido,
    );

    // 3. Actualizar el puntero del componente
    await this.actualizarVersionActual(componenteId, nuevoContenidoId);

    // 4. Registrar el rollback en la tabla rollback_historia
    await this.registrarRollback(
      componenteId,
      'componente_contenido:current', // Versión desde (placeholder)
      versionId,
      userId,
      razon || 'Restauración de versión anterior',
    );

    this.logger.log(
      `Versión ${versionId} restaurada exitosamente para componente ${componenteId}`,
    );

    return {
      componenteContenidoId: nuevoContenidoId,
      versionRestaurada: versionId,
      estado: 'draft',
    };
  }

  /**
   * Obtiene el historial de versiones de un componente.
   */
  async obtenerHistorialVersiones(componenteId: string) {
    const query = `
      SELECT * FROM version_contenido
      WHERE componente = type::thing("componente", $componenteId)
      ORDER BY numero_version DESC;
    `;

    const versiones = await this.surrealDb.query<any[]>(query, {
      componenteId: this.extractId(componenteId),
    });

    return versiones || [];
  }

  /**
   * Compara dos versiones de contenido.
   */
  async compararVersiones(versionAnteriorId: string, versionNuevaId: string, userId: string) {
    const versionAnterior = await this.obtenerVersion(versionAnteriorId);
    const versionNueva = await this.obtenerVersion(versionNuevaId);

    if (!versionAnterior || !versionNueva) {
      throw new NotFoundException('Una o ambas versiones no fueron encontradas');
    }

    // Calcular diferencias (implementación simplificada)
    const diferencias = this.calcularDiferencias(
      versionAnterior.contenido_snapshot,
      versionNueva.contenido_snapshot,
    );

    // Guardar la comparación
    const query = `
      CREATE comparacion_version CONTENT {
        version_anterior: type::thing("version_contenido", $versionAnteriorId),
        version_nueva: type::thing("version_contenido", $versionNuevaId),
        diferencias: $diferencias,
        resumen_cambios: $resumen,
        realizada_por: type::thing("user", $userId)
      }
      RETURN *;
    `;

    const resumen = this.generarResumenCambios(diferencias);

    await this.surrealDb.query(query, {
      versionAnteriorId: this.extractId(versionAnteriorId),
      versionNuevaId: this.extractId(versionNuevaId),
      diferencias,
      resumen,
      userId: this.extractId(userId),
    });

    return {
      versionAnterior: versionAnteriorId,
      versionNueva: versionNuevaId,
      diferencias,
      resumen,
    };
  }

  // ============================================================================
  // MÉTODOS PRIVADOS
  // ============================================================================

  private async obtenerComponente(componenteId: string) {
    const query = `
      SELECT * FROM type::thing("componente", $componenteId);
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      componenteId: this.extractId(componenteId),
    });

    return result?.[0];
  }

  private async obtenerComponenteContenido(contenidoId: string) {
    const query = `
      SELECT * FROM type::thing("componente_contenido", $contenidoId);
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      contenidoId: this.extractId(contenidoId),
    });

    return result?.[0];
  }

  private async obtenerVersion(versionId: string) {
    const query = `
      SELECT * FROM type::thing("version_contenido", $versionId);
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      versionId: this.extractId(versionId),
    });

    return result?.[0];
  }

  private async crearVersionSnapshot(
    componente: any,
    contenidoActual: any,
    userId: string,
    cambiosDescripcion: string,
    tipoCambio: string,
  ) {
    // Obtener el último número de versión
    const queryMaxVersion = `
      SELECT VALUE numero_version FROM version_contenido
      WHERE componente = type::thing("componente", $componenteId)
      ORDER BY numero_version DESC
      LIMIT 1;
    `;

    const maxVersion = await this.surrealDb.query<number[]>(queryMaxVersion, {
      componenteId: this.extractId(componente.id),
    });

    const nuevoNumeroVersion = (maxVersion?.[0] || 0) + 1;

    // Crear el snapshot
    const query = `
      CREATE version_contenido CONTENT {
        componente: type::thing("componente", $componenteId),
        numero_version: $numeroVersion,
        contenido_snapshot: $snapshot,
        cambios_descripcion: $cambiosDescripcion,
        tipo_cambio: $tipoCambio,
        creado_por: type::thing("user", $userId),
        checksum: crypto::md5($snapshot)
      }
      RETURN *;
    `;

    await this.surrealDb.query(query, {
      componenteId: this.extractId(componente.id),
      numeroVersion: nuevoNumeroVersion,
      snapshot: {
        tipo: contenidoActual.tipo,
        contenido: contenidoActual.contenido,
        validacion_calidad: contenidoActual.validacion_calidad,
      },
      cambiosDescripcion,
      tipoCambio,
      userId: this.extractId(userId),
    });

    this.logger.log(
      `Snapshot creado para componente ${componente.id}, versión ${nuevoNumeroVersion}`,
    );
  }

  private async crearNuevoContenido(
    componenteId: string,
    tipo: string,
    contenido: any,
  ): Promise<string> {
    const query = `
      CREATE componente_contenido CONTENT {
        componente: type::thing("componente", $componenteId),
        tipo: $tipo,
        contenido: $contenido,
        estado: 'draft'
      }
      RETURN id;
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      componenteId: this.extractId(componenteId),
      tipo,
      contenido,
    });

    return result?.[0]?.id;
  }

  private async actualizarContenido(
    contenidoId: string,
    contenido: any,
  ): Promise<string> {
    const query = `
      UPDATE type::thing("componente_contenido", $contenidoId)
      SET contenido = $contenido
      RETURN id;
    `;

    const result = await this.surrealDb.query<any[]>(query, {
      contenidoId: this.extractId(contenidoId),
      contenido,
    });

    return result?.[0]?.id;
  }

  private async actualizarVersionActual(
    componenteId: string,
    contenidoId: string,
  ) {
    const query = `
      UPDATE type::thing("componente", $componenteId)
      SET version_contenido_actual = type::thing("componente_contenido", $contenidoId)
      RETURN *;
    `;

    await this.surrealDb.query(query, {
      componenteId: this.extractId(componenteId),
      contenidoId: this.extractId(contenidoId),
    });
  }

  private async registrarRollback(
    componenteId: string,
    versionDesdeId: string,
    versionHaciaId: string,
    userId: string,
    razon: string,
  ) {
    const query = `
      CREATE rollback_historia CONTENT {
        componente: type::thing("componente", $componenteId),
        version_desde: type::thing("version_contenido", $versionDesdeId),
        version_hacia: type::thing("version_contenido", $versionHaciaId),
        realizado_por: type::thing("user", $userId),
        razon: $razon
      }
      RETURN *;
    `;

    await this.surrealDb.query(query, {
      componenteId: this.extractId(componenteId),
      versionDesdeId: this.extractId(versionDesdeId),
      versionHaciaId: this.extractId(versionHaciaId),
      userId: this.extractId(userId),
      razon,
    });
  }

  private calcularDiferencias(anterior: any, nueva: any): any {
    // Implementación simplificada de diff
    // En una implementación real, usarías una librería como 'deep-diff' o 'jsondiffpatch'
    return {
      campos_modificados: Object.keys(nueva).filter(
        (key) => JSON.stringify(anterior[key]) !== JSON.stringify(nueva[key]),
      ),
      campos_agregados: Object.keys(nueva).filter(
        (key) => !(key in anterior),
      ),
      campos_eliminados: Object.keys(anterior).filter(
        (key) => !(key in nueva),
      ),
    };
  }

  private generarResumenCambios(diferencias: any): string {
    const partes: string[] = [];

    if (diferencias.campos_modificados?.length) {
      partes.push(
        `${diferencias.campos_modificados.length} campo(s) modificado(s)`,
      );
    }

    if (diferencias.campos_agregados?.length) {
      partes.push(
        `${diferencias.campos_agregados.length} campo(s) agregado(s)`,
      );
    }

    if (diferencias.campos_eliminados?.length) {
      partes.push(
        `${diferencias.campos_eliminados.length} campo(s) eliminado(s)`,
      );
    }

    return partes.join(', ') || 'Sin cambios detectados';
  }

  private extractId(recordId: string): string {
    if (!recordId) {
      throw new BadRequestException('ID inválido');
    }

    const parts = recordId.split(':');
    return parts.length > 1 ? parts[parts.length - 1] : recordId;
  }
}
