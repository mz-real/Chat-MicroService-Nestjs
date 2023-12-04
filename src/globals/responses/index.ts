import { ApiProperty } from '@nestjs/swagger';
import { API_STATUS } from '../enums';

export class ApiResponse<T = any> {
  @ApiProperty()
  status: API_STATUS;
  @ApiProperty()
  message: string;
  @ApiProperty()
  data?: T;
}
