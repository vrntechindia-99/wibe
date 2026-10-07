import { IsInt, IsOptional, Min, Max, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum CallHistorySortBy {
  STARTED_AT = 'startedAt',
  DURATION = 'durationSeconds',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class CallHistoryQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ required: false, enum: CallHistorySortBy })
  @IsOptional()
  @IsEnum(CallHistorySortBy)
  sortBy?: CallHistorySortBy = CallHistorySortBy.STARTED_AT;

  @ApiProperty({ required: false, enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}