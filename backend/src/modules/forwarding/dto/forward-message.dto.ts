import { IsArray, IsNotEmpty, IsUUID, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForwardMessageDto {
  @ApiProperty({ type: [String], example: ['conv-id-1', 'conv-id-2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsNotEmpty()
  conversationIds: string[];

  @ApiProperty({ required: false, example: 'Check this out!' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string;
}