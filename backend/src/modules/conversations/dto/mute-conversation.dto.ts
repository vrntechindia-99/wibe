import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class MuteConversationDto {
  @ApiProperty({ required: false, description: 'Mute duration in seconds' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(31536000) // 1 year
  duration?: number;
}