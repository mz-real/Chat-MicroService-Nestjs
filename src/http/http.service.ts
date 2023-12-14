import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

@Injectable()
export class HttpService {
  private readonly axiosInstance: AxiosInstance;

  constructor(private configService: ConfigService) {
    this.axiosInstance = axios.create({
      baseURL: this.configService.get<string>('ADMIN_URL'),
      timeout: 5000,
    });
  }

  async get<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.get(url);
    return response.data;
  }

  async post<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.axiosInstance.post(url, data);
    return response.data;
  }

}
