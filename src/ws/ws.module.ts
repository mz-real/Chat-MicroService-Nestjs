import { Module } from '@nestjs/common';
import { WsController } from './ws.controller';
import { WsService } from './ws.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { WebSocketModule } from 'src/websocket/websocket.module';
import { UserModule } from 'src/user/user.module';

@Module({
  controllers: [WsController],
  imports: [
    TypeOrmModule.forFeature([ User]),
     WebSocketModule,
     UserModule,
  ],
  providers: [WsService]
})
export class WsModule {}
