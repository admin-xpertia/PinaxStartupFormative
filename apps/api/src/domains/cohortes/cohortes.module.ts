import { Module } from "@nestjs/common";
import { CohortesController } from "./cohortes.controller";
import { CohortesService } from "./cohortes.service";
import { SurrealDbModule } from "src/core/database";
import { AuthModule } from "src/core/auth";
import { ProgramasModule } from "../programas/programas.module";

@Module({
  imports: [SurrealDbModule, AuthModule, ProgramasModule],
  controllers: [CohortesController],
  providers: [CohortesService],
  exports: [CohortesService],
})
export class CohortesModule {}
