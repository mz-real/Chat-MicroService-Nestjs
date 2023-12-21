import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { Inject, Logger, OnModuleInit } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChatService } from 'src/chat/service/chat.service';
import { ConfigService } from '@nestjs/config';
import { UserRole, UserStatus } from 'src/users/entities/user.entity';
import { API_STATUS } from 'src/globals/enums';
import { HttpService } from 'src/http/http.service';
import { NotificationService } from 'src/notifications/notifications.service';
import { Message } from 'src/messages/entities/message.entity';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

interface UserConnectionInfo {
  userId: string;
  clientId: any;
  role: UserRole;
  status: UserStatus;
}

@WebSocketGateway({
  cors: { origin: '*' },
})
export class WebSocketGate
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private userConnections: Map<string, UserConnectionInfo> = new Map();
  private logger: Logger;

  constructor(
    private userService: UserService,
    @Inject(ChatService) private readonly chatService: ChatService,
    private configService: ConfigService,
    @Inject(HttpService) private httpService: HttpService,
    private readonly notificationService: NotificationService,
  ) {}

  onModuleInit() {
    this.logger = new Logger('WebSocketGate');
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const token = client.handshake.query.token as string;
      const decoded = jwt.verify(
        token,
        this.configService.get('JWT_SECRET'),
      ) as JwtPayload;
      client.data = {
        userId: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
      let user = await this.userService.findUserById(client.data.userId);
      if (!user) {
        user = await this.userService.createUser(
          decoded.email,
          decoded.role,
          decoded.sub,
        );
      }
      this.addClientToUser(client.data.userId, client.id, decoded.role as UserRole);
      await this.userService.updateUserStatus(client.data.userId, UserStatus.Online);
      this.logger.log(`Client connected: ${client.id}`)
  
      if (user.role === UserRole.Client) {
        const existingConversation = await this.chatService.getConversations(user.userId);
        if (!existingConversation.data || existingConversation.data.length === 0) {
          const createConversationResponse = await this.chatService.createConversation({userId: user.userId, email: user.email, role: user.role});
          if (createConversationResponse.status === API_STATUS.SUCCESS) {
            const room = createConversationResponse.data.ticketId;
            await this.notificationService.createNotification(user.userId, room, `New Conversation of user ${user.email}`);

            client.join(room);
            this.sendNotificationToOtherParticipants(client.data.userId, room, 'Client joined the conversation');
            this.logger.log(`New conversation created and client joined room: ${room}`);
          } else {
            this.logger.error(`Failed to create conversation for client: ${user.email}`);
          }
        } else {
          const room = existingConversation.data[0].ticketId;
          client.join(room);
          this.logger.log(`Existing conversation found, client joined room: ${room}`);
          this.sendNotificationToOtherParticipants(client.data.userId, room, 'Client joined the conversation');
        }
      }
  
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`);
      client.disconnect();
    }
  }
  

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    this.removeClientFromUser(client.data.userId);
    await this.userService.updateUserStatus(
      client.data.userId,
      UserStatus.Offline,
    );
    this.logger.log(`Client disconnected: ${client.id}--------------->`);
  }
  
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const ticketId = data.ticketId;
      
      const assignedUserResponse = await this.httpService.get<any>(`auth/ticket-user/${ticketId}`);
      if (assignedUserResponse && assignedUserResponse.id) {
        client.join(ticketId);
        this.sendNotificationToOtherParticipants(client.data.userId, ticketId, 'Staff member joined the conversation');
        this.logger.log(`Staff member ${assignedUserResponse.id} joined room for ticket ${ticketId}`);
      } else {
        this.logger.error(`Staff member is not assigned to ticket ${ticketId}`);
      }
    } catch (error) {
      this.logger.error(`Error in handleJoinRoom: ${error.message}`);
    }
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(
    @MessageBody() data: { ticketId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.userId;
      const ticketId = data.ticketId;

      const isPartOfConversation = await this.isUserInConversation(userId, ticketId);
      if (isPartOfConversation) {
        client.leave(ticketId);
        this.server.to(ticketId).emit('notification', `User ${userId} has left the room ${ticketId}`);
        this.logger.log(`User ${userId} left room ${ticketId}`);
      } else {
        this.logger.error(`User ${userId} is not part of the room ${ticketId}`);
      }
    } catch (error) {
      this.logger.error(`Error leaving room: ${error.message}`);
    }
  }

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: { ticketId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const userId = client.data.userId;
      const ticketId = data.ticketId;
      const messageContent = data.message;

      const conversation = await this.chatService.findConversationByTicketId(ticketId);
      if (!conversation) {
        throw new Error(`Conversation with ticket ID ${ticketId} not found.`);
      }

      const savedMessage = await this.chatService.sendMessage(conversation.id, userId, messageContent);

      if (savedMessage.status === API_STATUS.SUCCESS) {
        this.sendNotificationToOtherParticipants(userId, ticketId, `New Message sent by ${userId}: ${messageContent}`, savedMessage?.data);
        this.logger.log(`Message sent in room ${ticketId} by ${userId}: ${messageContent}`);
      } else {
        this.logger.error(`Failed to save message for room ${ticketId} by ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`);
    }
  }

  private addClientToUser(userId: string, clientId: any, role: UserRole) {
    const userConnectionInfo: UserConnectionInfo = {
      userId: userId,
      clientId: clientId,
      role: role,
      status: UserStatus.Online,
    };
  
    this.userConnections.set(String(userId), userConnectionInfo);
  }
  
  private removeClientFromUser(userId: string) {
    this.userConnections.delete(userId);
  }

  private async isUserInConversation(userId: string, ticketId: string): Promise<boolean> {
    const conversation = await this.chatService.findConversationByTicketId(ticketId);
    return conversation ? conversation.participants.some(p => p.userId === userId) : false;
  }

  private getUserClientIds(userId: string): any[] {
    return this.userConnections.get(userId)?.clientId ? [this.userConnections.get(userId).clientId] : [];
  }

  private async sendNotificationToOtherParticipants(senderId: string, ticketId: string, message: string, isMessage?: Message) {
    try {
      const conversation = await this.chatService.findConversationByTicketId(ticketId);
      if (conversation) {
        const participantIds = conversation.participants.map(participant => participant.userId);
        const otherParticipants = participantIds.filter(id => id !== senderId);
        for (const userId of otherParticipants) {

          const clientIds = this.getUserClientIds(String(userId));
          if (isMessage) {
            await this.notificationService.createNotification(userId, ticketId, `New message Received by => ${isMessage.sender}  Message => ${isMessage.content}`);
           }
          try {
            for (const clientId of clientIds) {
                this.server.to(clientId).emit('notification', message);
                if(isMessage){
                this.server.to(clientId).emit('message', `New message Received by => ${isMessage.sender.email}  Message => ${isMessage.content}`);}
            }
          } catch (error) {
            this.logger.error(`Error creating notification for user ${userId}: ${error.message}`);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error retrieving conversation for ticket ${ticketId}: ${error.message}`);
    }
  }
  
  

}
