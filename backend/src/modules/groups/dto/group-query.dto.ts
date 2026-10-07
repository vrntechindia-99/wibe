import { IsOptional, IsInt, Min, Max, IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum GroupSortBy {
  UPDATED_AT = 'updatedAt',
  CREATED_AT = 'createdAt',
  NAME = 'name',
  MEMBER_COUNT = 'memberCount',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GroupQueryDto {
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

  @ApiProperty({ required: false, enum: GroupSortBy })
  @IsOptional()
  @IsEnum(GroupSortBy)
  sortBy?: GroupSortBy = GroupSortBy.UPDATED_AT;

  @ApiProperty({ required: false, enum: SortOrder })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;
}