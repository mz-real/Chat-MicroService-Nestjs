import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateConversationDto, CreateMessageDto, UpdateMessageDto } from '../dtos/chat.dto';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { Message } from 'src/messages/entities/message.entity';
import { User } from 'src/users/entities/user.entity';
import { ApiForbiddenResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Chat')
@Injectable()
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
   * @param createConversationDto DTO containing participant IDs.
   * @returns The newly created conversation.
   */
  @ApiOkResponse({ description: 'Successfully created conversation', type: Conversation })
  @ApiNotFoundResponse({ description: 'One or more participants not found.' })
  async createConversation(createConversationDto: CreateConversationDto): Promise<Conversation> {
    const { participantIds } = createConversationDto;

    // Check if participants exist
    const participants = await this.userRepository.findByIds(participantIds);
    if (participants.length !== participantIds.length) {
      throw new NotFoundException('One or more participants not found.');
    }

    // Create conversation
    const newConversation = this.conversationRepository.create({ participants });
    return this.conversationRepository.save(newConversation);
  }

  /**
   * Get messages from a specific conversation.
   * @param conversationId ID of the conversation.
   * @returns List of messages in the conversation.
   */
  @ApiOkResponse({ description: 'Successfully retrieved messages', type: [Message] })
  @ApiNotFoundResponse({ description: 'Conversation not found.' })
  async getMessages(conversationId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { conversation: { id: conversationId } },
      relations: ['conversation', 'sender'],
    });
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
  async createMessage(
    senderId: string,
    conversationId: string,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId }
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    // Check if the sender is a participant in the conversation
    if (!conversation.participants.some(participant => participant.id === senderId)) {
      throw new ForbiddenException('Sender is not a participant in the conversation.');
    }

    const sender = await this.userRepository.findOne({
      where: { id: senderId }
    });
    if (!sender) {
      throw new NotFoundException('Sender not found.');
    }

    const message = this.messageRepository.create({
      ...createMessageDto,
      sender,
      conversation,
    });

    return this.messageRepository.save(message);
  }

  /**
   * Update a specific message.
   * @param messageId ID of the message.
   * @param updateMessageDto DTO containing updated message content.
   * @returns The updated message.
   */
  @ApiOkResponse({ description: 'Successfully updated message', type: Message })
  @ApiNotFoundResponse({ description: 'Message not found.' })
  async updateMessage(messageId: string, updateMessageDto: UpdateMessageDto): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId}
    });
    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    Object.assign(message, updateMessageDto);
    return this.messageRepository.save(message);
  }

  /**
   * Delete a specific message.
   * @param messageId ID of the message.
   * @returns The deleted message.
   */
  @ApiOkResponse({ description: 'Successfully deleted message', type: Message })
  @ApiNotFoundResponse({ description: 'Message not found.' })
  async deleteMessage(messageId: string): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId}
    });
    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    await this.messageRepository.remove(message);
    return message;
  }

  /**
   * Get conversations for a user.
   * @param userId ID of the user.
   * @returns List of conversations for the user.
   */
  @ApiOkResponse({ description: 'Successfully retrieved conversations', type: [Conversation] })
  async getConversations(userId: string): Promise<Conversation[]> {
    return this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'user')
      .where('user.id = :userId', { userId })
      .getMany();
  }

  /**
   * Get the history of a specific chat conversation.
   * @param conversationId ID of the conversation.
   * @returns List of messages in the conversation.
   */
  @ApiOkResponse({ description: 'Successfully retrieved conversation history', type: [Message] })
  @ApiNotFoundResponse({ description: 'Conversation not found.' })
  async getConversationHistory(conversationId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: { conversation: { id: conversationId } },
      relations: ['conversation', 'sender'],
    });
  }
}
