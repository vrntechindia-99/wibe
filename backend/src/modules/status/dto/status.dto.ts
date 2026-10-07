import { IsString, IsNotEmpty, IsOptional, IsIn, IsArray, IsUUID, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MessageType, PrivacyLevel } from '@prisma/client';

export class CreateStatusDto {
  @ApiProperty({ enum: MessageType, example: MessageType.IMAGE })
  @IsIn(Object.values(MessageType))
  type: MessageType;

  @ApiProperty({ required: false, example: 'Having a great day!' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;

  @ApiProperty({ required: false, example: 'https://...' })
  @IsOptional()
  @IsString()
  mediaUrl?: string;

  @ApiProperty({ required: false, example: 'https://...' })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiProperty({ enum: PrivacyLevel, example: PrivacyLevel.CONTACTS })
  @IsIn(Object.values(PrivacyLevel))
  privacy: PrivacyLevel;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  selectedUsers?: string[];
}

export class UpdateStatusDto {
  @ApiProperty({ required: false, example: 'Updated caption' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;

  @ApiProperty({ enum: PrivacyLevel, required: false })
  @IsOptional()
  @IsIn(Object.values(PrivacyLevel))
  privacy?: PrivacyLevel;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  selectedUsers?: string[];
}

export class StatusReplyDto {
  @ApiProperty({ example: 'Nice photo!' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  content: string;
}