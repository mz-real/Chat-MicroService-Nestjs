import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole, UserStatus } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { ApiResponse } from 'src/globals/responses';
import { API_STATUS } from 'src/globals/enums'; // Replace with the correct path

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(email: string, role: string, userId: string): Promise<User> {
    try {
      let user = await this.userRepository.findOne({ where: { userId } });
      
      if (user) {
        console.log("User already exists:", user);
        return user;
      }
  
      user = new User();
      user.email = email;
      user.role = role as UserRole;
      user.userId = userId;
  
      return await this.userRepository.save(user);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return await this.userRepository.findOne({ where: { userId } });
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

  async getUserStatus(userId: string): Promise<ApiResponse<{ status: UserStatus }>> {
    try {
      const user = await this.findUserById(userId);

      if (!user) {
        throw new NotFoundException(`User not found with ID: ${userId}`);
      }

      return {
        status: API_STATUS.SUCCESS,
        message: 'Successfully retrieved user status',
        data: { status: user.status },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException({
        status: API_STATUS.FAILURE,
        message: 'Failed to get user status. Internal server error.',
      });
    }
  }

  // Additional user-related methods as needed
}
