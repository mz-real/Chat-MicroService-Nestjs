import { Module } from '@nestjs/common';
import { WsController } from './ws.controller';
import { WsService } from './ws.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';

@Module({
  controllers: [WsController],
  imports: [
    TypeOrmModule.forFeature([ User]),
  ],
  providers: [WsService]
})
export class WsModule {}
