import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddReactionDto {
  @ApiProperty({ example: '❤️' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(8) // Unicode emoji max length
  emoji: string;
}