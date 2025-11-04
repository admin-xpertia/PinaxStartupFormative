import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Surreal from 'surrealdb.js';

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
      this.logger.log('Conectando a SurrealDB...');

      this.db = new Surreal();

      const url = this.configService.get<string>('SURREAL_URL');
      const namespace = this.configService.get<string>('SURREAL_NAMESPACE');
      const database = this.configService.get<string>('SURREAL_DATABASE');
      const user = this.configService.get<string>('SURREAL_USER');
      const pass = this.configService.get<string>('SURREAL_PASS');

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
        `Conectado a SurrealDB: ${url} (${namespace}/${database})`,
      );
    } catch (error) {
      this.logger.error('Error al conectar con SurrealDB', error);
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
        this.logger.log('Desconectado de SurrealDB');
      }
    } catch (error) {
      this.logger.error('Error al desconectar de SurrealDB', error);
    }
  }

  /**
   * Obtiene la instancia de SurrealDB
   */
  getDb(): Surreal {
    if (!this.db) {
      throw new Error('SurrealDB no está conectado');
    }
    return this.db;
  }

  /**
   * Ejecuta una query SurrealQL
   */
  async query<T = any>(sql: string, vars?: Record<string, any>): Promise<T> {
    try {
      const result: any = await this.db.query(sql, vars);
      return result[0]?.result as T;
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
      const result = await this.db.select(thing);
      return result as T[];
    } catch (error) {
      this.logger.error(`Error en select: ${thing}`, error);
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
      const token = await this.db.signin({
        NS: this.configService.get<string>('SURREAL_NAMESPACE'),
        DB: this.configService.get<string>('SURREAL_DATABASE'),
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
      const token = await this.db.signup({
        NS: this.configService.get<string>('SURREAL_NAMESPACE'),
        DB: this.configService.get<string>('SURREAL_DATABASE'),
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
      this.logger.error('Error en invalidate', error);
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
      this.logger.error('Error en authenticateWithToken', error);
      throw error;
    }
  }
}
