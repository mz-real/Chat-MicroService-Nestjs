import { Module } from '@nestjs/common';
import { WebSocketGate } from './websocket.gateway';
import { ChatModule } from 'src/chat/chat.module';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [ChatModule, UserModule],
  providers: [WebSocketGate],
  exports: [WebSocketGate]
})
export class WebSocketModule {}
