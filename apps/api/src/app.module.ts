import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { SurrealDbModule } from "./core/database";
import { AuthGuard } from "./core/guards/auth.guard";
import { UsuariosModule } from "./domains/usuarios/usuarios.module";
import { ProgramasModule } from "./domains/programas/programas.module";
import { GeneracionModule } from "./domains/generacion/generacion.module";
import { ContenidoModule } from "./domains/contenido/contenido.module";
import { CohortesModule } from "./domains/cohortes/cohortes.module";
import { AnalyticsModule } from "./domains/analytics/analytics.module";

/**
 * Módulo principal de la aplicación
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

    // Dominios
    UsuariosModule,

    ProgramasModule,

    GeneracionModule,

    ContenidoModule,

    CohortesModule,

    AnalyticsModule,
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
