import { IsInt, IsOptional, Min, Max, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum ConversationSortBy {
  UPDATED_AT = 'updatedAt',
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class ConversationQueryDto {
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

  @ApiProperty({ required: false, enum: ConversationSortBy })
  @IsOptional()
  @IsEnum(ConversationSortBy)
  sortBy?: ConversationSortBy = ConversationSortBy.UPDATED_AT;

  @ApiProperty({ required: false, enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  includeArchived?: boolean = false;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
}