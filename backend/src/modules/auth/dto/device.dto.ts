import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DevicePlatform } from '@prisma/client';

export class DeviceDto {
  @ApiProperty({ example: 'device-uuid-123' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ enum: DevicePlatform, example: DevicePlatform.ANDROID })
  @IsEnum(DevicePlatform)
  platform: DevicePlatform;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  pushToken?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  appVersion?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  osVersion?: string;
}