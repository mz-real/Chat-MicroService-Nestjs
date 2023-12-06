import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req, ValidationPipe, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOkResponse, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ChatService } from '../service/chat.service';
import { CreateConversationDto, CreateMessageDto, UpdateMessageDto, UserDto } from '../dtos/chat.dto';

@UseGuards(AuthGuard('jwt'))
@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiBody({ type: CreateConversationDto, description: 'DTO for creating a conversation' })
  @ApiOkResponse({ status: HttpStatus.CREATED, description: 'Conversation created successfully', type: UserDto })
  async createConversation(
    @Body(ValidationPipe) createConversationDto: CreateConversationDto,
    @Req() req: Request,
  ) {
    const userIdFromJwt = req.user['userId'];
    const emailFromJwt = req.user['email'];
    const roleFromJwt = req.user['role'];

    const participantsWithJwtUser: UserDto[] = [
      { email: emailFromJwt, role: roleFromJwt, userId: userIdFromJwt },
      ...createConversationDto.participants,
    ];

    return this.chatService.createConversation(participantsWithJwtUser);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get conversations for the authenticated user' })
  @ApiOkResponse({ status: HttpStatus.OK, description: 'List of conversations for the user', type: [UserDto] })
  async getConversations(@Req() req: Request) {
    const userId = req.user['userId'];
    return this.chatService.getConversations(userId);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get messages for a specific conversation' })
  @ApiOkResponse({ status: HttpStatus.OK, description: 'List of messages in the conversation', type: [CreateMessageDto] })
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId);
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Create a new message in a conversation' })
  @ApiBody({ type: CreateMessageDto, description: 'Message content' })
  @ApiOkResponse({ status: HttpStatus.CREATED, description: 'Message created successfully', type: CreateMessageDto })
  async createMessage(
    @Param('conversationId') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: Request,
  ) {
    const senderId = req.user['userId'];
    return this.chatService.sendMessage(conversationId, senderId, createMessageDto.content);
  }

  @Put('messages/:messageId')
  @ApiOperation({ summary: 'Update a specific message' })
  @ApiBody({ type: UpdateMessageDto, description: 'Updated message content' })
  @ApiOkResponse({ status: HttpStatus.OK, description: 'Message updated successfully', type: CreateMessageDto })
  async updateMessage(@Param('messageId') messageId: string, @Body() updateMessageDto: UpdateMessageDto) {
    return this.chatService.updateMessage(messageId, updateMessageDto);
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete a specific message' })
  @ApiOkResponse({ status: HttpStatus.OK, description: 'Message deleted successfully', type: CreateMessageDto })
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: 'Message not found' })
  async deleteMessage(@Param('messageId') messageId: string) {
    return this.chatService.deleteMessage(messageId);
  }

  @Get('conversations/:conversationId/history')
  @ApiOperation({ summary: 'Get the history of a specific conversation' })
  @ApiOkResponse({ status: HttpStatus.OK, description: 'List of messages in the conversation', type: [CreateMessageDto] })
  async getConversationHistory(@Param('conversationId') conversationId: string) {
    return this.chatService.getConversationHistory(conversationId);
  }
}
