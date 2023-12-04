import { Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { WsService } from './ws.service';
import { ApiBearerAuth, ApiResponse, ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('WebSocket')
@Controller('ws')
export class WsController {
  constructor(private readonly wsService: WsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('connect')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Establish WebSocket connection' })
  @ApiOperation({ summary: 'Establish WebSocket connection' })
  async connect(@Req() req: Request) {
    return this.wsService.connect(req.user['userId'],req.user['email'], req.user['role']);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('disconnect')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Close WebSocket connection' })
  @ApiOperation({ summary: 'Close WebSocket connection' })
  async disconnect(@Req() req: Request) {
    return this.wsService.disconnect(req.user['userId']);
  }
}
