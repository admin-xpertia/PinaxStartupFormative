import { Module } from "@nestjs/common";
import { ProgramasController } from "./programas.controller";
import { ArquitecturaController } from "./arquitectura.controller";
import { ProofPointsController } from "./proofpoints.controller";
import { ProgramasService } from "./programas.service";
import { ProgramOwnershipGuard } from "./guards/program-ownership.guard";
import { SurrealDbModule } from "src/core/database";
import { AuthModule } from "src/core/auth";

@Module({
  imports: [SurrealDbModule, AuthModule],
  controllers: [
    ProgramasController,
    ArquitecturaController,
    ProofPointsController,
  ],
  providers: [ProgramasService, ProgramOwnershipGuard],
  exports: [ProgramasService, ProgramOwnershipGuard],
})
export class ProgramasModule {}
