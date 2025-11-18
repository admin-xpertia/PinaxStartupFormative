import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { SurrealDbModule } from "./core/database";
import { AuthGuard } from "./core/guards/auth.guard";

// New DDD Architecture Modules
import { AuthModule } from "./modules/auth.module";
import { ProgramDesignModule } from "./modules/program-design.module";
import { ExerciseCatalogModule } from "./modules/exercise-catalog.module";
import { ExerciseInstanceModule } from "./modules/exercise-instance.module";
import { ExerciseProgressModule } from "./modules/exercise-progress.module";
import { CohortModule } from "./modules/cohort.module";
import { StudentModule } from "./modules/student.module";

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

    // DDD Bounded Context Modules
    AuthModule,
    ProgramDesignModule,
    ExerciseCatalogModule,
    ExerciseInstanceModule,
    ExerciseProgressModule,
    CohortModule,
    StudentModule,
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
