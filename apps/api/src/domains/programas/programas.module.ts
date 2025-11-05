import { Module } from "@nestjs/common";
import { ProgramasController } from "./programas.controller";
import { ArquitecturaController } from "./arquitectura.controller";
import { ProofPointsController } from "./proofpoints.controller";
import { ComponentesController } from "./componentes.controller";
import { ProgramasService } from "./programas.service";
import { ComponentesService } from "./componentes.service";
import { ProgramOwnershipGuard } from "./guards/program-ownership.guard";
import { SurrealDbModule } from "src/core/database";
import { AuthModule } from "src/core/auth";
import { ContenidoModule } from "../contenido/contenido.module";

@Module({
  imports: [SurrealDbModule, AuthModule, ContenidoModule],
  controllers: [
    ProgramasController,
    ArquitecturaController,
    ProofPointsController,
    ComponentesController,
  ],
  providers: [ProgramasService, ComponentesService, ProgramOwnershipGuard],
  exports: [ProgramasService, ComponentesService, ProgramOwnershipGuard],
})
export class ProgramasModule {}
