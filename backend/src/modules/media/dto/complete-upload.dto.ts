import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteUploadDto {
  @ApiProperty({ example: 'upload-session-id' })
  @IsString()
  @IsNotEmpty()
  uploadSessionId: string;

  @ApiProperty({ required: false, example: 'checksum-hash' })
  @IsOptional()
  @IsString()
  checksum?: string;
}