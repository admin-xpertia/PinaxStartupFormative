import { ApiProperty } from '@nestjs/swagger';

/**
 * Generate Content Response DTO
 */
export class GenerateContentResponseDto {
  @ApiProperty({
    description: 'Exercise instance ID',
    example: 'exercise_instance:abc123',
  })
  exerciseInstanceId: string;

  @ApiProperty({
    description: 'Generated content ID',
    example: 'exercise_content:xyz789',
  })
  contentId: string;

  @ApiProperty({
    description: 'Generation status',
    example: 'generado',
    enum: ['generado', 'error'],
  })
  status: string;

  @ApiProperty({
    description: 'Preview of generated content',
    example: { titulo: 'Mi lección', secciones: [...] },
    required: false,
  })
  contentPreview?: any;

  @ApiProperty({
    description: 'Number of tokens used in generation',
    example: 1500,
    required: false,
  })
  tokensUsed?: number;

  @ApiProperty({
    description: 'When the content was generated (ISO 8601)',
    example: '2025-01-15T10:00:00Z',
  })
  generatedAt: string;
}
