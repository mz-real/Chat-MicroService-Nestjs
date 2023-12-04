import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class CreateConversationDto {
  @IsArray()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Array of participant user IDs',
    required: true,
    type: [String],
  })
  participantIds: string[];
}

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Message content',
    required: true,
  })
  content: string;
}

export class UpdateMessageDto {
  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Updated message content',
    required: false,
  })
  content?: string;
}
