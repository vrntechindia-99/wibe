import { IsOptional, IsBoolean, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { GroupRole } from '@prisma/client';

export class GroupSettingsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  onlyAdminsCanSend?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  onlyAdminsCanEditInfo?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  onlyAdminsCanAddMembers?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(5000)
  maxMembers?: number;
}