import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationController } from './notifications.controller';
import { NotificationService } from './notifications.service';
import { Notification } from './notification.entity/notification.entity';
import { ChatModule } from 'src/chat/chat.module';
import { UserModule } from 'src/user/user.module';


@Module({
  imports: [TypeOrmModule.forFeature([Notification]), ChatModule, UserModule],
  controllers: [NotificationController],
  providers: [NotificationService],
  exports: [NotificationService],
})

export class NotificationModule {}
