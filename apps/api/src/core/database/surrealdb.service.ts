import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Surreal from "surrealdb.js";

/**
 * Servicio para gestionar la conexión con SurrealDB
 *
 * Este servicio proporciona una instancia de SurrealDB configurada
 * y lista para ser inyectada en otros servicios.
 */
@Injectable()
export class SurrealDbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SurrealDbService.name);
  private db: Surreal;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Conecta a SurrealDB
   */
  private async connect(): Promise<void> {
    try {
      this.logger.log("Conectando a SurrealDB...");

      this.db = new Surreal();

      const url = this.configService.get<string>("SURREAL_URL");
      const namespace = this.configService.get<string>("SURREAL_NAMESPACE");
      const database = this.configService.get<string>("SURREAL_DATABASE");
      const user = this.configService.get<string>("SURREAL_USER");
      const pass = this.configService.get<string>("SURREAL_PASS");

      this.logger.log(`🔧 Configuration:`);
      this.logger.log(`   URL: ${url}`);
      this.logger.log(`   Namespace: ${namespace}`);
      this.logger.log(`   Database: ${database}`);
      this.logger.log(`   User: ${user}`);

      // Conectar al servidor
      await this.db.connect(url);

      // Autenticarse primero a nivel root
      await this.db.signin({
        username: user,
        password: pass,
      });

      // Seleccionar namespace y database
      await this.db.use({ namespace, database });

      this.logger.log(
        `✅ Conectado a SurrealDB: ${url} (${namespace}/${database})`,
      );
    } catch (error) {
      this.logger.error("❌ Error al conectar con SurrealDB", error);
      throw error;
    }
  }

  /**
   * Desconecta de SurrealDB
   */
  private async disconnect(): Promise<void> {
    try {
      if (this.db) {
        await this.db.close();
        this.logger.log("Desconectado de SurrealDB");
      }
    } catch (error) {
      this.logger.error("Error al desconectar de SurrealDB", error);
    }
  }

  /**
   * Obtiene la instancia de SurrealDB
   */
  getDb(): Surreal {
    if (!this.db) {
      throw new Error("SurrealDB no está conectado");
    }
    return this.db;
  }

  /**
   * Ejecuta una query SurrealQL
   *
   * SurrealDB query() devuelve un array donde cada elemento corresponde
   * a cada statement ejecutado. Por ejemplo:
   * - Query única: [[{...registro...}]]
   * - Múltiples queries: [[{...}], [{...}], ...]
   */
  async query<T = any>(sql: string, vars?: Record<string, any>): Promise<T> {
    try {
      const result: any = await this.db.query(sql, vars);

      this.logger.debug(
        `Query result RAW: ${JSON.stringify(result, null, 2)}`,
      );
      this.logger.debug(
        `Query result type: ${typeof result}, isArray: ${Array.isArray(result)}, length: ${result?.length}`,
      );

      if (!Array.isArray(result)) {
        return result as T;
      }

      // Si no hay resultados, retornar array vacío
      if (result.length === 0) {
        this.logger.warn("Query returned empty array - possible permission issue or failed assertion");
        return [] as T;
      }

      // Si solo hay un statement en la query, extraer su resultado
      if (result.length === 1) {
        const firstResult = result[0];
        this.logger.debug(
          `First result type: ${typeof firstResult}, isArray: ${Array.isArray(firstResult)}, value: ${JSON.stringify(firstResult)}`,
        );

        // El resultado de cada statement es un array de registros
        if (Array.isArray(firstResult)) {
          // Si el statement devolvió un solo registro, retornarlo directamente
          // Si devolvió múltiples, retornar el array
          return firstResult as T;
        }

        // Fallback si no es un array (no debería pasar)
        return firstResult as T;
      }

      // Si hay múltiples statements, retornar todos los resultados
      return result as T;
    } catch (error) {
      this.logger.error(`Error en query: ${sql}`, error);
      throw error;
    }
  }

  /**
   * Selecciona registros de una tabla
   */
  async select<T = any>(thing: string): Promise<T[]> {
    try {
      this.logger.debug(`📄 SELECT: ${thing}`);
      const result = await this.db.select(thing);
      this.logger.debug(`📄 SELECT result type: ${typeof result}, isArray: ${Array.isArray(result)}`);
      this.logger.debug(`📄 SELECT result: ${JSON.stringify(result, null, 2)}`);
      return result as T[];
    } catch (error) {
      this.logger.error(`❌ Error en select: ${thing}`, error);
      throw error;
    }
  }

  /**
   * Crea un registro
   */
  async create<T = any>(thing: string, data: any): Promise<T> {
    try {
      const result: any = await this.db.create(thing, data);
      return result as T;
    } catch (error) {
      this.logger.error(`Error en create: ${thing}`, error);
      throw error;
    }
  }

  /**
   * Actualiza un registro
   */
  async update<T = any>(thing: string, data: any): Promise<T> {
    try {
      const result: any = await this.db.update(thing, data);
      return result as T;
    } catch (error) {
      this.logger.error(`Error en update: ${thing}`, error);
      throw error;
    }
  }

  /**
   * Elimina un registro
   */
  async delete(thing: string): Promise<void> {
    try {
      await this.db.delete(thing);
    } catch (error) {
      this.logger.error(`Error en delete: ${thing}`, error);
      throw error;
    }
  }

  /**
   * Autentica usando un scope (para signup/signin)
   */
  async authenticate(
    scope: string,
    credentials: Record<string, any>,
  ): Promise<string> {
    try {
      // Incluir alias en mayúsculas para compatibilidad con definiciones ACCESS/SCOPES
      const namespace = this.configService.get<string>("SURREAL_NAMESPACE");
      const database = this.configService.get<string>("SURREAL_DATABASE");

      const token = await this.db.signin({
        scope,
        namespace,
        database,
        NS: namespace,
        DB: database,
        AC: scope,
        SC: scope,
        ...credentials,
      });
      return token;
    } catch (error) {
      this.logger.error(`Error en authenticate (scope: ${scope})`, error);
      throw error;
    }
  }

  /**
   * Registra un nuevo usuario usando un scope
   */
  async signup(
    scope: string,
    credentials: Record<string, any>,
  ): Promise<string> {
    try {
      // Incluir alias en mayúsculas para compatibilidad con definiciones ACCESS/SCOPES
      const namespace = this.configService.get<string>("SURREAL_NAMESPACE");
      const database = this.configService.get<string>("SURREAL_DATABASE");

      const token = await this.db.signup({
        scope,
        namespace,
        database,
        NS: namespace,
        DB: database,
        AC: scope,
        SC: scope,
        ...credentials,
      });
      return token;
    } catch (error) {
      this.logger.error(`Error en signup (scope: ${scope})`, error);
      throw error;
    }
  }

  /**
   * Invalida el token actual
   */
  async invalidate(): Promise<void> {
    try {
      await this.db.invalidate();
    } catch (error) {
      this.logger.error("Error en invalidate", error);
      throw error;
    }
  }

  /**
   * Autentica con un token JWT
   */
  async authenticateWithToken(token: string): Promise<void> {
    try {
      await this.db.authenticate(token);
    } catch (error) {
      this.logger.error("Error en authenticateWithToken", error);
      throw error;
    }
  }

  /**
   * Obtiene información del usuario autenticado actual ($auth)
   */
  async getAuthInfo<T = any>(): Promise<T> {
    try {
      const authResult = await this.query<any>("RETURN $auth;");

      if (authResult) {
        return authResult as T;
      }

      // Respaldo: intentar SELECT (puede requerir permisos explícitos)
      const selectAuth = await this.query<any>("SELECT * FROM $auth;");
      if (selectAuth) {
        return selectAuth as T;
      }

      // Último recurso: info()
      const info = await this.db.info();
      return info as T;
    } catch (error) {
      this.logger.error("Error en getAuthInfo", error);
      throw error;
    }
  }
}
