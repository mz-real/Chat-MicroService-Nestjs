import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsEmail, IsIn } from 'class-validator';


export class UserDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    description: 'Email of the user',
    required: true,
    type: String,
  })
  email: string;

  @IsNotEmpty()
  @IsIn(['client', 'staff'])
  @ApiProperty({
    description: 'Role of the user (client or staff)',
    required: true,
    type: String,
    enum: ['client', 'staff'],
  })
  role: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'User ID',
    required: true,
    type: String,
  })
  userId: string;
}

export class CreateConversationDto {
  @IsArray()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Array of participant users',
    required: true,
    type: [UserDto],
  })
  participants: UserDto[];
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
