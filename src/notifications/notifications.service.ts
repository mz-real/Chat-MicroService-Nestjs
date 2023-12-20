import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity/notification.entity';
import { ChatService } from 'src/chat/service/chat.service';
import { ApiResponse } from 'src/globals/responses';
import { API_STATUS } from 'src/globals/enums';
import { ApiBadRequestResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger'; // Import Swagger decorators
import { UserService } from 'src/user/user.service';

@Injectable()
@ApiTags('Notification')
export class NotificationService {
  @Inject(ChatService) private readonly chatService: ChatService;
  @Inject(UserService) private readonly userService: UserService;

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Get notifications for a specific conversation.
   * @param conversationId ID of the conversation.
   * @returns List of notifications in the conversation.
   */
  @ApiOkResponse({ description: 'Successfully retrieved notifications', type: ApiResponse<[Notification]> })
  @ApiNotFoundResponse({ description: 'Conversation not found.', type: ApiResponse })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.', type: ApiResponse })
  async getNotificationsForConversation(conversationId: string): Promise<ApiResponse<Notification[]>> {
    try {
      const data = await this.notificationRepository.find({ where: { conversation: { id: conversationId } } });
      return {
        status: API_STATUS.SUCCESS,
        message: 'Successfully retrieved notifications',
        data: data,
      };
    } catch (error) {
      throw new NotFoundException({
        status: API_STATUS.FAILURE,
        message: 'Conversation not found.',
      });
    }
  }

  /**
   * Acknowledge a specific notification.
   * @param notificationId ID of the notification.
   * @returns The acknowledged notification.
   */
  @ApiOkResponse({ description: 'Successfully acknowledged notification', type: ApiResponse<void> })
  @ApiBadRequestResponse({ description: 'Notification not found.', type: ApiResponse })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.', type: ApiResponse })
  async acknowledgeNotification(notificationId: string): Promise<ApiResponse<void>> {
    try {
      await this.notificationRepository.update(notificationId, { acknowledged: true });
      return {
        status: API_STATUS.SUCCESS,
        message: 'Notification acknowledged successfully',
      };
    } catch (error) {
      throw new BadRequestException({
        status: API_STATUS.FAILURE,
        message: 'Failed to acknowledge notification. Internal server error.',
      });
    }
  }

  /**
   * Create a new notification for a specific user and ticket.
   * @param userId ID of the user.
   * @param ticketId ID of the ticket.
   * @param content Content of the notification.
   * @returns The newly created notification.
   */
  @ApiOkResponse({ description: 'Successfully created notification', type: ApiResponse<Notification> })
  @ApiNotFoundResponse({ description: 'User or conversation not found.', type: ApiResponse })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.', type: ApiResponse })
  async createNotification(userId: string, ticketId: string, content: string): Promise<ApiResponse<Notification>> {
    try {
      const conversation = await this.chatService.findConversationByTicketId(ticketId);
      const user = await this.userService.findUserById(userId);

      if (!conversation) {
        throw new NotFoundException(`Conversation not found for ticketId: ${ticketId}`);
      }

      if (!user) {
        throw new NotFoundException(`User not found for userId: ${userId}`);
      }

      const notification = this.notificationRepository.create({
        user,
        conversation,
        content,
      });

      return {
        status: API_STATUS.SUCCESS,
        message: 'Successfully created notification',
        data: await this.notificationRepository.save(notification),
      };
    } catch (error) {
      throw new BadRequestException({
        status: API_STATUS.FAILURE,
        message: 'Failed to create notification. Internal server error.',
      });
    }
  }

  /**
   * Dismiss a specific notification.
   * @param notificationId ID of the notification.
   * @returns The dismissed notification.
   */
  @ApiOkResponse({ description: 'Successfully dismissed notification', type: ApiResponse<Notification> })
  @ApiBadRequestResponse({ description: 'Notification not found.', type: ApiResponse })
  @ApiInternalServerErrorResponse({ description: 'Internal server error.', type: ApiResponse })
  async dismissNotification(notificationId: string): Promise<ApiResponse<Notification>> {
    try {
      const notification = await this.notificationRepository.findOne({ where : {id : notificationId} });
      if (!notification) {
        throw new BadRequestException({
          status: API_STATUS.FAILURE,
          message: `Notification not found with ID: ${notificationId}`,
        });
      }

      notification.dismissed = true;
      await this.notificationRepository.save(notification);

      return {
        data: notification,
        status: API_STATUS.SUCCESS,
        message: 'Notification dismissed successfully',
      };
    } catch (error) {
      throw new BadRequestException({
        status: API_STATUS.FAILURE,
        message: 'Failed to dismiss notification. Internal server error.',
      });
    }
  }

  /**
   * Get notifications for a specific user.
   * @param userId ID of the user.
   * @returns List of notifications for the user.
   */
  @ApiOkResponse({
    description: 'Successfully retrieved notifications for the user',
    type: ApiResponse<[Notification]>,
  })
  @ApiBadRequestResponse({
    description: 'User not found or no notifications for the user',
    type: ApiResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error.',
    type: ApiResponse,
  })
  async getNotificationsForUser(userId: string): Promise<ApiResponse<Notification[]>> {
    try {
      const notifications = await this.notificationRepository.find({ where: { user: { userId } } });
  
      if (notifications.length === 0) {
        return {
          status: API_STATUS.SUCCESS,
          message: 'No notifications found for the user',
          data: [],
        };
      }
  
      return {
        status: API_STATUS.SUCCESS,
        message: 'Successfully retrieved notifications',
        data: notifications,
      };
    } catch (error) {
      throw new BadRequestException({
        status: API_STATUS.FAILURE,
        message: 'Failed to retrieve notifications. Internal server error.',
      });
    }
  }
}
