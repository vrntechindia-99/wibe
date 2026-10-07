import { IsString, IsNotEmpty, IsNumber, Min, Max, IsIn, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  AUDIO = 'AUDIO',
}

export class CreateUploadSessionDto {
  @ApiProperty({ enum: MediaType })
  @IsIn(Object.values(MediaType))
  mediaType: MediaType;

  @ApiProperty({ example: 'image/jpeg' })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({ example: 'photo.jpg' })
  @IsString()
  @IsNotEmpty()
  originalFilename: string;

  @ApiProperty({ example: 2048576 })
  @IsNumber()
  @Min(1)
  @Max(100 * 1024 * 1024) // 100MB max
  sizeBytes: number;

  @ApiProperty({ required: false, example: 'vacation photo' })
  @IsOptional()
  @IsString()
  caption?: string;

  @ApiProperty({ required: false, example: 'conv-uuid' })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({ required: false, example: 'msg-client-id' })
  @IsOptional()
  @IsString()
  clientMessageId?: string;
}