import { Body, Controller, Post } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppService } from './app.service';
import { STATE } from './records/enums/state.enum';

@Controller()
export class AppController {
  constructor(
    private readonly configService: ConfigService,
    private readonly appService: AppService,
  ) {}

  @Post('/state')
  async getStateOfRequest(@Body('id') requestId: string) {
    return await this.appService.getRequestStatus(requestId);
  }
}
