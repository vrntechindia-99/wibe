import { IsString, IsNotEmpty, IsOptional, IsArray, MaxLength, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGroupDto {
  @ApiProperty({ example: 'My Group' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ required: false, example: 'Group description' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ type: [String], example: ['user-id-1', 'user-id-2'] })
  @IsArray()
  @IsUUID('4', { each: true })
  memberIds: string[];
}