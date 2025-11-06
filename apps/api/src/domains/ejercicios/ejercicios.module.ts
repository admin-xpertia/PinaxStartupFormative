import { Module } from '@nestjs/common';
import { ExerciseTemplatesService } from './exercise-templates.service';
import { ExerciseInstancesService } from './exercise-instances.service';
import { ExerciseGenerationService } from './exercise-generation.service';
import { ExerciseTemplatesController } from './exercise-templates.controller';
import { ExerciseInstancesController } from './exercise-instances.controller';
import { ExerciseGenerationController } from './exercise-generation.controller';
import { ProgramasModule } from '../programas/programas.module';
import { GeneracionModule } from '../generacion/generacion.module';

@Module({
  imports: [ProgramasModule, GeneracionModule],
  providers: [
    ExerciseTemplatesService,
    ExerciseInstancesService,
    ExerciseGenerationService,
  ],
  controllers: [
    ExerciseTemplatesController,
    ExerciseInstancesController,
    ExerciseGenerationController,
  ],
  exports: [
    ExerciseTemplatesService,
    ExerciseInstancesService,
    ExerciseGenerationService,
  ],
})
export class EjerciciosModule {}
