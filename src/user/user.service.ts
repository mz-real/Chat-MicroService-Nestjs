// user.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(email: string, role: string, userId: string): Promise<User> {
    const user = new User();
    user.email = email;
    user.role = role;
    return this.userRepository.save(user);
  }

  async updateUserStatus(userId: string, status: string): Promise<void> {
    await this.userRepository.update(userId, { status });
  }

  async findUserById(userId: string): Promise<User | undefined> {
    return this.userRepository.findOne({where: { userId: userId}});
  }

  async findUserByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { email } });
  }

  // Additional user-related methods as needed
}
