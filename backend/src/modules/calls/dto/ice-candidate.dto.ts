import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IceCandidateDto {
  @ApiProperty({ example: 'call-uuid' })
  @IsString()
  @IsNotEmpty()
  callId: string;

  @ApiProperty({ example: 'candidate:1 1 UDP 2122260223...' })
  @IsString()
  @IsNotEmpty()
  candidate: string;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  sdpMLineIndex?: number;

  @ApiProperty({ example: '0', required: false })
  @IsOptional()
  sdpMid?: string;
}