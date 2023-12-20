import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBadRequestResponse, ApiBearerAuth, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service';
import { ApiResponse } from 'src/globals/responses';
import { UserStatus } from 'src/users/entities/user.entity';

@Controller('integration/user')
@ApiBearerAuth()
@ApiTags('User')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':userId/status')
  @ApiOperation({ summary: 'Get user status by ID' })
  @ApiBearerAuth()
  @ApiNotFoundResponse({ description: 'User not found', type: ApiResponse })
  @ApiBadRequestResponse({ description: 'Failed to get user status. Internal server error.', type: ApiResponse })
  @ApiOkResponse({ description: 'Successfully retrieved user status', type: ApiResponse })
  async getUserStatus(@Param('userId') userId: string): Promise<ApiResponse<{ status: UserStatus }>> {
    return this.userService.getUserStatus(userId);
  }
}
