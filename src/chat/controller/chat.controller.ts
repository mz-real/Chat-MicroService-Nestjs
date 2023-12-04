import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiOkResponse, ApiNotFoundResponse, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { ChatService } from '../service/chat.service';
import { CreateConversationDto, CreateMessageDto, UpdateMessageDto } from '../dtos/chat.dto';

@UseGuards(AuthGuard('jwt'))
@ApiTags('Chat')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Create a new conversation' })
  @ApiBody({ type: CreateConversationDto, description: 'Array of participant IDs' })
  @ApiOkResponse({ description: 'Conversation created successfully' })
  async createConversation(@Body() createConversationDto: CreateConversationDto) {
    return this.chatService.createConversation(createConversationDto);
  }

  @Get('conversations')
  @ApiOperation({ summary: 'Get conversations for the authenticated user' })
  @ApiOkResponse({ description: 'List of conversations for the user' })
  async getConversations(@Req() req: Request) {
    const userId = req.user['sub'];
    return this.chatService.getConversations(userId);
  }

  @Get('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Get messages for a specific conversation' })
  @ApiOkResponse({ description: 'List of messages in the conversation' })
  async getMessages(@Param('conversationId') conversationId: string) {
    return this.chatService.getMessages(conversationId);
  }

  @Post('conversations/:conversationId/messages')
  @ApiOperation({ summary: 'Create a new message in a conversation' })
  @ApiBody({ type: CreateMessageDto, description: 'Message content' })
  @ApiOkResponse({ description: 'Message created successfully' })
  async createMessage(
    @Param('conversationId') conversationId: string,
    @Body() createMessageDto: CreateMessageDto,
    @Req() req: Request,
  ) {
    const senderId = req.user['sub'];
    return this.chatService.createMessage(senderId, conversationId, createMessageDto);
  }

  @Put('messages/:messageId')
  @ApiOperation({ summary: 'Update a specific message' })
  @ApiBody({ type: UpdateMessageDto, description: 'Updated message content' })
  @ApiOkResponse({ description: 'Message updated successfully' })
  async updateMessage(
    @Param('messageId') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto,
  ) {
    return this.chatService.updateMessage(messageId, updateMessageDto);
  }

  @Delete('messages/:messageId')
  @ApiOperation({ summary: 'Delete a specific message' })
  @ApiOkResponse({ description: 'Message deleted successfully' })
  @ApiNotFoundResponse({ description: 'Message not found' })
  async deleteMessage(@Param('messageId') messageId: string) {
    return this.chatService.deleteMessage(messageId);
  }

  @Get('conversations/:conversationId/history')
  @ApiOperation({ summary: 'Get the history of a specific conversation' })
  @ApiOkResponse({ description: 'List of messages in the conversation' })
  async getConversationHistory(@Param('conversationId') conversationId: string) {
    return this.chatService.getConversationHistory(conversationId);
  }
}
