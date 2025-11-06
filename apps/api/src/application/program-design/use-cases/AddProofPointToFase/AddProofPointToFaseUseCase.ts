import { Injectable, Logger, Inject } from '@nestjs/common';
import { ICommand } from '../../../shared/interfaces/IUseCase';
import { Result } from '../../../shared/types/Result';
import { IFaseRepository, IProofPointRepository } from '../../../../domain/program-design/repositories/IProgramRepository';
import { ProofPoint } from '../../../../domain/program-design/entities/ProofPoint';
import { RecordId } from '../../../../domain/shared/value-objects/RecordId';
import { ProofPointSlug } from '../../../../domain/program-design/value-objects/ProofPointSlug';

/**
 * AddProofPointToFase UseCase
 * Adds a new proof point to a fase
 *
 * Flow:
 * 1. Validate fase exists
 * 2. Create or validate slug
 * 3. Calculate ordenEnFase (next available)
 * 4. Create ProofPoint entity
 * 5. Save proof point
 * 6. Return proof point ID
 */

export interface AddProofPointToFaseRequest {
  faseId: string;
  nombre: string;
  slug?: string;
  descripcion: string;
  preguntaCentral: string;
  duracionEstimadaHoras: number;
  tipoEntregableFinal?: string;
  documentacionContexto?: string;
  prerequisitos?: string[];
}

export interface AddProofPointToFaseResponse {
  proofPointId: string;
  nombre: string;
  slug: string;
  ordenEnFase: number;
}

@Injectable()
export class AddProofPointToFaseUseCase
  implements ICommand<AddProofPointToFaseRequest, AddProofPointToFaseResponse>
{
  private readonly logger = new Logger(AddProofPointToFaseUseCase.name);

  constructor(
    @Inject('IFaseRepository')
    private readonly faseRepository: IFaseRepository,
    @Inject('IProofPointRepository')
    private readonly proofPointRepository: IProofPointRepository,
  ) {}

  async execute(
    request: AddProofPointToFaseRequest,
  ): Promise<Result<AddProofPointToFaseResponse, Error>> {
    try {
      // 1. Validate fase exists
      const faseId = RecordId.fromString(request.faseId);
      const fase = await this.faseRepository.findById(faseId);

      if (!fase) {
        return Result.fail(new Error(`Fase not found: ${request.faseId}`));
      }

      // 2. Create slug if not provided
      const slug = request.slug
        ? ProofPointSlug.create(request.slug)
        : ProofPointSlug.fromName(request.nombre);

      // Check slug uniqueness
      const existingWithSlug = await this.proofPointRepository.findBySlug(slug.getValue());
      if (existingWithSlug) {
        return Result.fail(new Error(`Slug already in use: ${slug.getValue()}`));
      }

      // 3. Calculate ordenEnFase (get existing proof points and find max orden)
      const existingProofPoints = await this.proofPointRepository.findByFase(faseId);
      const maxOrden = existingProofPoints.length > 0
        ? Math.max(...existingProofPoints.map(pp => pp.getOrdenEnFase()))
        : 0;
      const newOrden = maxOrden + 1;

      // 4. Create ProofPoint entity
      const proofPoint = ProofPoint.create(
        faseId,
        request.nombre,
        request.descripcion,
        newOrden,
        request.duracionEstimadaHoras,
        request.preguntaCentral,
      );

      // 5. Save proof point
      const savedProofPoint = await this.proofPointRepository.save(proofPoint);

      this.logger.log(
        `ProofPoint added to fase successfully: ${savedProofPoint.getId().toString()}`,
      );

      // 6. Return response
      return Result.ok({
        proofPointId: savedProofPoint.getId().toString(),
        nombre: savedProofPoint.getNombre(),
        slug: savedProofPoint.getSlug().getValue(),
        ordenEnFase: savedProofPoint.getOrdenEnFase(),
      });
    } catch (error) {
      this.logger.error('Failed to add proof point to fase', error);
      return Result.fail(error as Error);
    }
  }
}
