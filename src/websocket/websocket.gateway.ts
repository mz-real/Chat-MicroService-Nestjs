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

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@WebSocketGateway({
  cors: { origin: '*' },
})
export class WebSocketGate
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  private userClientMap: Map<string, string[]> = new Map();
  private logger: Logger;

  constructor(
    private userService: UserService,
    private chatService: ChatService,
    private configService: ConfigService,
    @Inject(HttpService) private httpService: HttpService,
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
      this.addClientToUser(client.data.userId, client.id);
      await this.userService.updateUserStatus(client.data.userId, UserStatus.Online);
      this.logger.log(`Client connected: ${client.id}`)
  
      if (user.role === UserRole.Client) {
        const existingConversation = await this.chatService.getConversations(user.userId);
        if (!existingConversation.data || existingConversation.data.length === 0) {
          const createConversationResponse = await this.chatService.createConversation({userId: user.userId, email: user.email, role: user.role});
          if (createConversationResponse.status === API_STATUS.SUCCESS) {
            const room = createConversationResponse.data.ticketId;
            client.join(room);
            this.server.to(createConversationResponse.data.ticketId).emit('notification', `Client member joined the room for ticket ${createConversationResponse.data.ticketId}`);
            this.logger.log(`New conversation created and client joined room: ${room}`);
          } else {
            this.logger.error(`Failed to create conversation for client: ${user.email}`);
          }
        } else {
          const room = existingConversation.data[0].ticketId;
          client.join(room);
          this.logger.log(`Existing conversation found, client joined room: ${room}`);
        }
      }
  
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}`);
      client.disconnect();
    }
  }
  

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    this.removeClientFromUser(client.data.userId, client.id);
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
        this.server.to(ticketId).emit('notification', `Staff member joined the room for ticket ${ticketId}`);
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
        this.server.to(ticketId).emit('message', {
          sender: userId,
          content: messageContent,
          createdAt: savedMessage.data.createdAt,
        });
        this.logger.log(`Message sent in room ${ticketId} by ${userId}: ${messageContent}`);
      } else {
        this.logger.error(`Failed to save message for room ${ticketId} by ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}`);
    }
  }

  notifyStaffOfNewMessageOrAssignment(ticketId: string, message: string): void {
    this.chatService.getStaffMembersByTicketId(ticketId).then(staffMembers => {
      staffMembers.forEach(staffMember => {
        const clientIds = this.getUserClientIds(staffMember.userId);
        clientIds.forEach(clientId => {
          this.server.to(clientId).emit('newAssignment', {
            ticketId,
            message
          });
        });
      });
    }).catch(error => {
      this.logger.error(`Error notifying staff: ${error.message}`);
    });
  }

  private addClientToUser(userId: string, clientId: string): void {
    const clientIds = this.userClientMap.get(userId) || [];
    clientIds.push(clientId);
    this.userClientMap.set(userId, clientIds);
  }

  private removeClientFromUser(userId: string, clientId: string): void {
    const clientIds = this.userClientMap.get(userId) || [];
    const updatedClientIds = clientIds.filter((id) => id !== clientId);
    this.userClientMap.set(userId, updatedClientIds);
  }

  private async isUserInConversation(userId: string, ticketId: string): Promise<boolean> {
    const conversation = await this.chatService.findConversationByTicketId(ticketId);
    return conversation ? conversation.participants.some(p => p.userId === userId) : false;
  }

  getUserClientIds(userId: string): string[] {
    return this.userClientMap.get(userId) || [];
  }
}
