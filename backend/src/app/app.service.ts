import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService){}

  getJWTSECRET(): string{
    return this.configService.get<string>('JWT_SECRET');
  }
  
  getPort(): number{
    return Number(this.configService.get<number>('PORT'));
  }

  getHello(): string {
    return 'Hello World!';
  }
}
