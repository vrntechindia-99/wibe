import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CallType } from '@prisma/client';

export class StartCallDto {
  @ApiProperty({ example: 'conversation-uuid' })
  @IsString()
  @IsNotEmpty()
  conversationId: string;

  @ApiProperty({ enum: CallType, example: CallType.VIDEO })
  @IsIn(Object.values(CallType))
  type: CallType;

  @ApiProperty({ required: false, example: 'user-device-id' })
  @IsOptional()
  @IsString()
  deviceId?: string;
}