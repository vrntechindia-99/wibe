import { IsInt, IsOptional, Min, Max, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum MessageSortBy {
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class MessageQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ required: false, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  before?: string; // Cursor for pagination

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  after?: string; // Cursor for pagination

  @ApiProperty({ required: false, enum: MessageSortBy })
  @IsOptional()
  @IsEnum(MessageSortBy)
  sortBy?: MessageSortBy = MessageSortBy.CREATED_AT;

  @ApiProperty({ required: false, enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;
}