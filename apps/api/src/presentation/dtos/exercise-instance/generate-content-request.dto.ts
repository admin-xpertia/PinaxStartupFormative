import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Generate Content Request DTO
 */
export class GenerateContentRequestDto {
  @ApiProperty({
    description: 'Force regeneration even if content already exists',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  forceRegenerate?: boolean;
}
