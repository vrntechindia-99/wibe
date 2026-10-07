import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CallOfferDto {
  @ApiProperty({ example: 'call-uuid' })
  @IsString()
  @IsNotEmpty()
  callId: string;

  @ApiProperty({ example: '{"type":"offer","sdp":"v=0\\r\\no=-..."}' })
  @IsString()
  @IsNotEmpty()
  sdp: string;
}