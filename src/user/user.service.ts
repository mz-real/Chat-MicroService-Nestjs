import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole, UserStatus } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(email: string, role: string, userId: string): Promise<User> {
    try {
      const user = new User();
      user.email = email;
      user.role = role as UserRole,
      user.userId = userId;
      return await this.userRepository.save(user);
    } catch (error) {
      if (error.code === '23505') {
        throw new BadRequestException(`User with ID ${userId} already exists.`);
      }
      throw new BadRequestException('Failed to create user. Internal server error.');
    }
  }

  async updateUserStatus(userId: string, status: UserStatus): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { userId } });
      if (!user) {
        throw new NotFoundException(`User not found with ID: ${userId}`);
      }
      user.status = status;
      await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update user status. Internal server error.', error.message);
    }
  }

  async findUserById(userId: string): Promise<User | undefined> {
    try {
      return await this.userRepository.findOne({ where: { userId: userId } });
    } catch (error) {
      throw new BadRequestException('Failed to find user by ID. Internal server error.');
    }
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    try {
      return await this.userRepository.findOne({ where: { email } });
    } catch (error) {
      throw new BadRequestException('Failed to find user by email. Internal server error.');
    }
  }

  // Additional user-related methods as needed
}
