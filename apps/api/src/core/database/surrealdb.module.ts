import { Module, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SurrealDbService } from "./surrealdb.service";

/**
 * Módulo global para SurrealDB
 *
 * Este módulo proporciona el servicio de SurrealDB
 * a toda la aplicación.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [SurrealDbService],
  exports: [SurrealDbService],
})
export class SurrealDbModule {}
