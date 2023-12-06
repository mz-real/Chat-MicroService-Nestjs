import { Injectable } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { WebSocketGate } from 'src/websocket/websocket.gateway';

@Injectable()
export class WsService {
  constructor(
    private webSocketGateway: WebSocketGate,
    private userService: UserService
  ) {}

  async connect(userId: string, email: string, role: string): Promise<any> {
    // Mark the user as online in the database
    await this.userService.updateUserStatus(userId, 'online');
    return { message: `User ${email} is ready to connect.` };
  }

  async disconnect(userId: string): Promise<any> {
    // Mark the user as offline in the database
    await this.userService.updateUserStatus(userId, 'offline');
    return { message: `User with ID ${userId} disconnected.` };
  }

  async broadcastMessage(message: string): Promise<void> {
    this.webSocketGateway.server.emit('broadcast', message);
  }

  async sendMessageToUser(userId: string, message: string): Promise<void> {
    const clientIds = this.webSocketGateway.getUserClientIds(userId);
    clientIds.forEach(clientId => {
      this.webSocketGateway.server.to(clientId).emit('message', message);
    });
  }
}
