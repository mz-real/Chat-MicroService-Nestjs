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
import { Logger, OnModuleInit } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ChatService } from 'src/chat/service/chat.service';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from 'src/users/entities/user.entity';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

@WebSocketGateway() 
export class WebSocketGate implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private userClientMap: Map<string, string[]> = new Map();
  private logger: Logger;

  constructor(
    private userService: UserService,
    private chatService: ChatService,
    private configService: ConfigService,
  ) {}

  onModuleInit() {
    this.logger = new Logger('WebSocketGate');
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const token = client.handshake.query.token as string;
      const decoded = jwt.verify(token, this.configService.get('JWT_SECRET')) as JwtPayload;
      client.data = {
        userId: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
      const user = await this.userService.findUserById(client.data.userId);
      if (!user) {
        await this.userService.createUser(
          decoded.email,
          decoded.role,
          decoded.sub,
        );
      }
      this.addClientToUser(client.data.userId, client.id);
      this.userService.updateUserStatus(client.data.userId, UserStatus.Online);
      this.logger.log(`Client disconnected: ${client.id}--------------->`);
    } catch (error) {
      this.logger.error(`Authentication error: ${error.message}--------------->`);
      client.disconnect();
    }
  }

  async handleDisconnect(@ConnectedSocket() client: Socket) {
    this.removeClientFromUser(client.data.userId, client.id);
    await this.userService.updateUserStatus(client.data.userId, UserStatus.Offline);
    this.logger.log(`Client disconnected: ${client.id}--------------->`);
  }

  @SubscribeMessage('joinRoom')
  async joinRoom(@MessageBody() data: { room: string }, @ConnectedSocket() client: Socket) {
    try {
      client.join(data.room);
      this.server.to(data.room).emit('notification', `User ${client.data.email} has joined the room ${data.room}--------------->`);
      this.logger.log(`User ${client.data.email} joined room ${data.room}--------------->`);
    } catch (error) {
      this.logger.error(`Error joining room: ${error.message}--------------->`);
    }
  }

  @SubscribeMessage('leaveRoom')
  async leaveRoom(@MessageBody() data: { room: string }, @ConnectedSocket() client: Socket) {
    try {
      client.leave(data.room);
      this.server.to(data.room).emit('notification', `User ${client.data.email} has left the room ${data.room}--------------->`);
      this.logger.log(`User ${client.data.email} left room ${data.room}--------------->`);
    } catch (error) {
      this.logger.error(`Error leaving room: ${error.message}--------------->`);
    }
  }

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: { room: string; message: string }, @ConnectedSocket() client: Socket) {
    try {
      this.server.to(data.room).emit('message', { user: client.data.email, message: data.message });
      this.logger.log(`Message from ${client.data.email} in room ${data.room}: ${data.message}--------------->`);
    } catch (error) {
      this.logger.error(`Error handling message: ${error.message}--------------->`);
    }
  }

  private  addClientToUser(userId: string, clientId: string): void {
    const clientIds = this.userClientMap.get(userId) || [];
    clientIds.push(clientId);
    this.userClientMap.set(userId, clientIds);
  }

  private removeClientFromUser(userId: string, clientId: string): void {
    const clientIds = this.userClientMap.get(userId) || [];
    const updatedClientIds = clientIds.filter((id) => id !== clientId);
    this.userClientMap.set(userId, updatedClientIds);
  }

  getUserClientIds(userId: string): string[] {
    return this.userClientMap.get(userId) || [];
  }
}
