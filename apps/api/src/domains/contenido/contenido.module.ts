import { Module } from "@nestjs/common";
import { ContenidoEdicionService } from "./contenido-edicion.service";
import { RubricaService } from "./rubrica.service";
import { ContenidoController } from "./contenido.controller";

@Module({
  controllers: [ContenidoController],
  providers: [ContenidoEdicionService, RubricaService],
  exports: [ContenidoEdicionService, RubricaService],
})
export class ContenidoModule {}
