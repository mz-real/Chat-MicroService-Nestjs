import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private activeUsers: Map<string, string> = new Map();
  configService: ConfigService;

  // Handle new connection
  handleConnection(client: Socket, ...args: any[]) {
    const token = client.handshake.query.token as string;
    try {
      const secret = this.getJwtSecret();
      const payload: any = jwt.verify(token, secret);
      const userId = payload.sub;
      if (userId) {
        this.activeUsers.set(client.id, userId);
        console.log(`Client connected: ${client.id} as user ${userId}`);
      } else {
        client.disconnect(); 
      }
    } catch (e) {
      client.disconnect();
    }
  }

  // Handle disconnection
  handleDisconnect(client: Socket) {
    const userId = this.activeUsers.get(client.id);
    this.activeUsers.delete(client.id);
    console.log(`Client disconnected: ${client.id} as user ${userId}`);
  }

  @SubscribeMessage('disconnect')
  handleDisconnectRequest(@ConnectedSocket() client: Socket) {
    client.disconnect();
  }


  private getJwtSecret(): string {
    const secret = this.configService.get("JWT_SECRET");
    if (typeof secret === 'string') {
      return secret;
    } else {
      throw new Error('JWT secret is not set in environment variables');
    }
  }}
