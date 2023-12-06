import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { CreateConversationDto, CreateMessageDto, UpdateMessageDto, UserDto } from '../dtos/chat.dto';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { Message } from 'src/messages/entities/message.entity';
import { User } from 'src/users/entities/user.entity';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiExtraModels,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';

@ApiTags('Chat')
@Injectable()
@ApiExtraModels(CreateConversationDto, CreateMessageDto, UpdateMessageDto, UserDto, Conversation, Message, User)
export class ChatService {
  constructor(
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Create a new chat conversation.
   * @param participants DTO containing participants.
   * @returns The newly created conversation.
   */
  @ApiOkResponse({ description: 'Successfully created conversation', type: Conversation })
  @ApiNotFoundResponse({ description: 'One or more participants not found.' })
  @ApiForbiddenResponse({ description: 'Failed to create conversation. Duplicate participants found.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async createConversation(participants: UserDto[]): Promise<Conversation> {
    // Check for duplicate participants
    const uniqueParticipants = new Set(participants.map(participant => participant.userId));
    if (uniqueParticipants.size !== participants.length) {
      throw new ForbiddenException('Failed to create conversation. Duplicate participants found.');
    }

    try {
      // Retrieve or create participants based on the provided UserDto objects
      const participantsEntities = await Promise.all(
        participants.map(async ({ userId, email, role }) => {
          let user = await this.userRepository.findOne({ where: { userId } });
          if (!user) {
            user = this.userRepository.create({ userId, email, role });
            await this.userRepository.save(user);
          }
          return user;
        }),
      );

      const conversation = new Conversation();
      conversation.participants = participantsEntities;
      return this.conversationRepository.save(conversation);
    } catch (error) {
      if (error instanceof QueryFailedError && error.message.includes('Duplicate entry')) {
        // Handle duplicate entry error
        throw new ForbiddenException('Failed to create conversation. Duplicate entry error.');
      }
      throw new ForbiddenException('Failed to create conversation. Internal server error.');
    }
  }
  

  /**
   * Get messages from a specific conversation.
   * @param conversationId ID of the conversation.
   * @returns List of messages in the conversation.
   */
  @ApiOkResponse({ description: 'Successfully retrieved messages', type: [Message] })
  @ApiNotFoundResponse({ description: 'Conversation not found.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      return this.messageRepository.find({
        where: { conversation: { id: conversationId } },
        relations: ['conversation', 'sender'],
      });
    } catch (error) {
      throw new NotFoundException('Conversation not found.');
    }
  }

  /**
   * Create a new message in a specific conversation.
   * @param senderId ID of the sender.
   * @param conversationId ID of the conversation.
   * @param createMessageDto DTO containing message content.
   * @returns The newly created message.
   */
  @ApiOkResponse({ description: 'Successfully created message', type: Message })
  @ApiNotFoundResponse({ description: 'Conversation or sender not found.' })
  @ApiForbiddenResponse({ description: 'Sender is not a participant in the conversation.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
    try {
      const conversation = await this.conversationRepository.findOne({ where: { id: conversationId } });
      const sender = await this.userRepository.findOne({ where: { userId: senderId } });

      if (!conversation || !sender) {
        throw new NotFoundException('Conversation or sender not found.');
      }

      const message = new Message();
      message.conversation = conversation; // Assign the conversation entity
      message.sender = sender; // Assign the sender (user) entity
      message.content = content;
      return this.messageRepository.save(message);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new ForbiddenException('Failed to send message.');
    }
  }

  /**
   * Update a specific message.
   * @param messageId ID of the message.
   * @param updateMessageDto DTO containing updated message content.
   * @returns The updated message.
   */
  @ApiOkResponse({ description: 'Successfully updated message', type: Message })
  @ApiNotFoundResponse({ description: 'Message not found.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async updateMessage(messageId: string, updateMessageDto: UpdateMessageDto): Promise<Message> {
    try {
      const message = await this.messageRepository.findOne({
        where: { id: messageId },
      });
      if (!message) {
        throw new NotFoundException('Message not found.');
      }

      Object.assign(message, updateMessageDto);
      return this.messageRepository.save(message);
    } catch (error) {
      throw new NotFoundException('Message not found.');
    }
  }

  /**
   * Delete a specific message.
   * @param messageId ID of the message.
   * @returns The deleted message.
   */
  @ApiOkResponse({ description: 'Successfully deleted message', type: Message })
  @ApiNotFoundResponse({ description: 'Message not found.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async deleteMessage(messageId: string): Promise<Message> {
    try {
      const message = await this.messageRepository.findOne({
        where: { id: messageId },
      });
      if (!message) {
        throw new NotFoundException('Message not found.');
      }

      await this.messageRepository.remove(message);
      return message;
    } catch (error) {
      throw new NotFoundException('Message not found.');
    }
  }

  /**
   * Get conversations for a user.
   * @param userId ID of the user.
   * @returns List of conversations for the user.
   */
  @ApiOkResponse({ description: 'Successfully retrieved conversations', type: [Conversation] })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async getConversations(userId: string): Promise<Conversation[]> {
    try {
      return this.conversationRepository
        .createQueryBuilder('conversation')
        .leftJoin('conversation.participants', 'user')
        .where('user.userId = :userId', { userId })
        .getMany();
    } catch (error) {
      throw new NotFoundException('User not found.');
    }
  }

  /**
   * Get the history of a specific chat conversation.
   * @param conversationId ID of the conversation.
   * @returns List of messages in the conversation.
   */
  @ApiOkResponse({ description: 'Successfully retrieved conversation history', type: [Message] })
  @ApiNotFoundResponse({ description: 'Conversation not found.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async getConversationHistory(conversationId: string): Promise<Message[]> {
    try {
      return this.getMessagesByConversation(conversationId);
    } catch (error) {
      throw new NotFoundException('Conversation not found.');
    }
  }

  /**
   * Get messages for a specific conversation.
   * @param conversationId ID of the conversation.
   * @returns List of messages in the conversation.
   */
  @ApiOkResponse({ description: 'Successfully retrieved messages', type: [Message] })
  @ApiNotFoundResponse({ description: 'Conversation not found.' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.' })
  async getMessagesByConversation(conversationId: string): Promise<Message[]> {
    try {
      return this.messageRepository.find({
        where: { conversation: { id: conversationId } },
      });
    } catch (error) {
      throw new NotFoundException('Conversation not found.');
    }
  }

}
