import { Controller, Get, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponse } from 'src/globals/responses';
import { NotificationService } from './notifications.service';
import { Notification } from './notification.entity/notification.entity';
import { AuthGuard } from '@nestjs/passport';

@Controller('internal/notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@ApiTags('Notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Get notifications for the logged-in user' })
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'List of notifications for the user',
    type: ApiResponse<Notification[]>,
  })
  @ApiNotFoundResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found or no notifications available',
  })
  @ApiInternalServerErrorResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async getNotificationsForLoggedInUser(@Req() req: any) {
    const userIdFromJwt = req.user['userId'];
    return this.notificationService.getNotificationsForUser(userIdFromJwt);
  }

  @Post('acknowledge/:notificationId')
  @ApiOperation({ summary: 'Acknowledge a specific notification' })
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Notification acknowledged successfully',
    type: ApiResponse,
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Notification not found',
  })
  @ApiInternalServerErrorResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async acknowledgeNotification(@Param('notificationId') notificationId: string) {
    return this.notificationService.acknowledgeNotification(notificationId);
  }

  @Post('/dismiss/:notificationId')
  @ApiOperation({ summary: 'Dismiss a specific notification' })
  @ApiOkResponse({
    status: HttpStatus.OK,
    description: 'Notification dismissed successfully',
    type: Notification,
  })
  @ApiBadRequestResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Notification not found',
  })
  @ApiInternalServerErrorResponse({
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error',
  })
  async dismissNotification(@Param('notificationId') notificationId: string) {
    return this.notificationService.dismissNotification(notificationId);
  }
}

