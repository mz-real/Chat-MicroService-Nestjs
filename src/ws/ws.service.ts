import { Injectable, OnModuleDestroy, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { ApiResponse, ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@ApiTags('WebSocket')
@Injectable()
export class WsService implements OnModuleDestroy {
  private server: Server;
  private connectedUsers = new Map<string, Socket>(); // Maps userID to Socket instance
  configService: ConfigService;

  constructor(
    configService: ConfigService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    this.configService = configService;
    this.server = new Server(this.configService.get('WS_PORT'));

    this.server.on('connection', (socket: Socket) => {
      console.log('A user connected');

      socket.on('register', async (userId: string) => {
        try {
          await this.registerUser(userId, socket);
        } catch (error) {
          console.error(error);
          socket.emit('error', 'Failed to register user');
        }
      });

      socket.on('disconnect', () => {
        try {
          this.disconnectUser(socket);
        } catch (error) {
          console.error(error);
        }
      });

      // Handle other events as necessary
    });
  }

  /**
   * Register user with WebSocket connection.
   * @param userId - User ID.
   * @param socket - Socket instance.
   * @returns API response.
   */
  @ApiOperation({ summary: 'Register user with WebSocket connection' })
  @ApiResponse({ status: 200, description: 'User registered successfully' })
  private async registerUser(userId: string, socket: Socket) {
    try {
      console.log('Trying to register user:', userId);

      if (!socket) {
        throw new Error('Socket is undefined');
      }

      this.connectedUsers.set(userId, socket);
      console.log(`User ${userId} connected with socket id ${socket.id}`);

      return { status: 200, message: 'User registered successfully' };
    } catch (error) {
      console.error('Error registering user:', userId, error);
      throw new HttpException('Failed to register user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Disconnect user from WebSocket.
   * @param socket - Socket instance.
   * @returns API response.
   */
  @ApiOperation({ summary: 'Disconnect user from WebSocket' })
  @ApiResponse({ status: 200, description: 'User disconnected successfully' })
  private async disconnectUser(socket: Socket) {
    try {
      this.connectedUsers.forEach((value, key) => {
        if (value === socket) {
          console.log(`User ${key} disconnected`);
          this.connectedUsers.delete(key);
        }
      });
      return { status: 200, message: 'User disconnected successfully' };
    } catch (error) {
      throw new HttpException('Failed to disconnect user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Connect a user programmatically.
   * @param userId - User ID.
   * @returns API response.
   */
  @ApiOperation({ summary: 'Connect a user programmatically' })
  @ApiResponse({ status: 200, description: 'User connected successfully' })
  public async connect(userId: string, email: string, role: string) {
    if (!userId || !email || !role) {
      throw new HttpException('Invalid user data', HttpStatus.BAD_REQUEST);
    }

    const socket = this.connectedUsers.get(userId);
    if (socket) {
      socket.emit('connected', 'You are connected!');
      return { status: 200, message: 'User connected successfully' };
    }

    try {
      // Check if the user exists in the database
      let user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user) {
        // If the user doesn't exist, create a new user record in the database
        user = this.userRepository.create({ id: userId, email, role });
        await this.userRepository.save(user);
        console.log(`User ${userId} created in the database`);
      }

      if (!user || !user.id) {
        console.error('User object or user.id is undefined:', user);
        throw new HttpException('Invalid user object', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return this.registerUser(userId, socket);
    } catch (error) {
      console.error('Error connecting user:', userId, error);
      throw new HttpException('Failed to connect user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Disconnect a user programmatically.
   * @param userId - User ID.
   * @returns API response.
   */
  @ApiOperation({ summary: 'Disconnect a user programmatically' })
  @ApiResponse({ status: 200, description: 'User disconnected successfully' })
  public async disconnect(userId: string) {
    try {
      const socket = this.connectedUsers.get(userId);
      if (socket) {
        socket.disconnect();
        this.connectedUsers.delete(userId);
        return { status: 200, message: 'User disconnected successfully' };
      }
      return { status: 404, message: 'User not found' };
    } catch (error) {
      console.error(error);
      throw new HttpException('Failed to disconnect user', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Send a message to a specific user.
   * @param userId - User ID.
   * @param message - Message to be sent.
   * @returns API response.
   */
  @ApiOperation({ summary: 'Send a message to a specific user' })
  @ApiResponse({ status: 200, description: 'Message sent successfully' })
  public async sendMessage(userId: string, message: string) {
    try {
      const socket = this.connectedUsers.get(userId);
      if (socket) {
        socket.emit('message', message);
        return { status: 200, message: 'Message sent successfully' };
      }
      return { status: 404, message: 'User not found' };
    } catch (error) {
      console.error(error);
      throw new HttpException('Failed to send message', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Broadcast an event to all connected users.
   * @param event - Event name.
   * @param data - Data to be broadcasted.
   * @returns API response.
   */
  @ApiOperation({ summary: 'Broadcast an event to all connected users' })
  @ApiResponse({ status: 200, description: 'Event broadcasted successfully' })
  public async broadcastEvent(event: string, data: any) {
    try {
      this.server.emit(event, data);
      return { status: 200, message: 'Event broadcasted successfully' };
    } catch (error) {
      console.error(error);
      throw new HttpException('Failed to broadcast event', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Get a list of connected users.
   * @returns List of connected users.
   */
  @ApiOperation({ summary: 'Get a list of connected users' })
  @ApiResponse({ status: 200, description: 'List of connected users', type: [String] })
  public getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  onModuleDestroy() {
    // Clean up resources, disconnect sockets, etc., when the module is destroyed
    this.server.close();
    this.connectedUsers.forEach((socket) => socket.disconnect());
    this.connectedUsers.clear();
  }
}
