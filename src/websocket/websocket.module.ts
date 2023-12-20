import { Module } from '@nestjs/common';
import { WebSocketGate } from './websocket.gateway';
import { ChatModule } from 'src/chat/chat.module';
import { UserModule } from 'src/user/user.module';
import { HttpService } from 'src/http/http.service';
import { NotificationModule } from 'src/notifications/notifications.module';
import { ChatService } from 'src/chat/service/chat.service';

@Module({
  imports: [ChatModule, UserModule, NotificationModule],
  providers: [WebSocketGate, HttpService],
  exports: [WebSocketGate]
})
export class WebSocketModule {}
