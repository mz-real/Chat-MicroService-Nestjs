import { Module } from '@nestjs/common';
import { ChatController } from './controller/chat.controller';
import { ChatService } from './service/chat.service';
import { User } from 'src/users/entities/user.entity';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { Message } from 'src/messages/entities/message.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpService } from 'src/http/http.service';
import { Notification } from 'src/notifications/notification.entity/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message, User, Notification]),
  ],
  controllers: [ChatController],
  providers: [ChatService, HttpService],
  exports: [ChatService]
})
export class ChatModule {}
