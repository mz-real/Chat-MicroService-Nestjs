import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DB_TYPE } from './globals/enums';
import { WebSocketModule } from './websocket/websocket.module';
import { UserModule } from './user/user.module';
import { WebSocketGate } from './websocket/websocket.gateway';
import { HttpService } from './http/http.service';

@Module({
  imports: [
    AuthModule,
    ConfigModule.forRoot({
      isGlobal: true, 
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: DB_TYPE.db_type,
        host: configService.get('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        retryAttempts: 5,
        retryDelay: 3000,
        autoLoadEntities: true,
        synchronize: true,
        // dropSchema: true,
      }),
      inject: [ConfigService],
    }),
    ChatModule,
    WebSocketModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService, WebSocketGate, HttpService],
  exports: [WebSocketGate]
})
export class AppModule {}
