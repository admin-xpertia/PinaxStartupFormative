import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { SurrealDbModule } from "./core/database";
import { AuthGuard } from "./core/guards/auth.guard";
import { UsuariosModule } from "./domains/usuarios/usuarios.module";

// New DDD Architecture Modules
import { ProgramDesignModule } from "./modules/program-design.module";
import { ExerciseCatalogModule } from "./modules/exercise-catalog.module";
import { ExerciseInstanceModule } from "./modules/exercise-instance.module";
import { ExerciseProgressModule } from "./modules/exercise-progress.module";

/**
 * Módulo principal de la aplicación
 *
 * Nota: Se ha migrado a arquitectura DDD con bounded contexts.
 * Los módulos legacy han sido reemplazados por los nuevos módulos DDD.
 */
@Module({
  imports: [
    // Configuración global
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Database
    SurrealDbModule,

    // Legacy: Auth module (temporal - will be migrated to DDD)
    UsuariosModule,

    // DDD Bounded Context Modules
    ProgramDesignModule,
    ExerciseCatalogModule,
    ExerciseInstanceModule,
    ExerciseProgressModule,
  ],
  providers: [
    // Guard global de autenticación
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
