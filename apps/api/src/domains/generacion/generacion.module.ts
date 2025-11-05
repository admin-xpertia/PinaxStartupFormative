import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { GeneracionController } from "./generacion.controller";
import { GeneracionService, OPENAI_CLIENT } from "./generacion.service";
import { ProgramasModule } from "../programas/programas.module";
import { SurrealDbModule } from "src/core/database";

@Module({
  imports: [HttpModule, ProgramasModule, SurrealDbModule],
  controllers: [GeneracionController],
  providers: [
    GeneracionService,
    {
      provide: OPENAI_CLIENT,
      useFactory: (configService: ConfigService) => {
        const apiKey = configService.get<string>("OPENAI_API_KEY");

        if (!apiKey) {
          throw new Error(
            "OPENAI_API_KEY no está configurada en las variables de entorno",
          );
        }

        return new OpenAI({
          apiKey,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [GeneracionService],
})
export class GeneracionModule {}
