import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PrivacyLevel } from '@prisma/client';

export class UpdatePrivacyDto {
  @ApiProperty({ enum: PrivacyLevel, required: false })
  @IsOptional()
  @IsEnum(PrivacyLevel)
  lastSeen?: PrivacyLevel;

  @ApiProperty({ enum: PrivacyLevel, required: false })
  @IsOptional()
  @IsEnum(PrivacyLevel)
  profilePhoto?: PrivacyLevel;

  @ApiProperty({ enum: PrivacyLevel, required: false })
  @IsOptional()
  @IsEnum(PrivacyLevel)
  about?: PrivacyLevel;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  readReceipts?: boolean;

  @ApiProperty({ enum: PrivacyLevel, required: false })
  @IsOptional()
  @IsEnum(PrivacyLevel)
  status?: PrivacyLevel;

  @ApiProperty({ enum: PrivacyLevel, required: false })
  @IsOptional()
  @IsEnum(PrivacyLevel)
  groups?: PrivacyLevel;
}