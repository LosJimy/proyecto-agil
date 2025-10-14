import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { MallaModule } from 'src/malla/malla.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal:true,
    }), AuthModule, MallaModule
  ],
})
export class AppModule {}
