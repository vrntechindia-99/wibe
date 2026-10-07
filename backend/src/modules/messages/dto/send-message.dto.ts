import { IsString, IsNotEmpty, IsOptional, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({ example: 'abc123-unique-id' })
  @IsString()
  @IsNotEmpty()
  clientMessageId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @IsUUID()
  replyToId?: string;

  @ApiProperty({ required: false, maxLength: 4096 })
  @IsOptional()
  @IsString()
  @MaxLength(4096)
  content?: string;
}