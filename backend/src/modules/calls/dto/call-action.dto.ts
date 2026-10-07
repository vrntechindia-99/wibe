import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CallType } from '@prisma/client';

export class CallActionDto {
  @ApiProperty({ example: 'call-uuid' })
  @IsString()
  @IsNotEmpty()
  callId: string;
}