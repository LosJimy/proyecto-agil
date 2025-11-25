import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { MallaModule } from 'src/malla/malla.module';
import { HttpModule } from '@nestjs/axios';
import { AvanceModule } from 'src/avance/avance.module';
import { Neo4jModule } from '../neo4j/neo4j.module';

@Module({
  imports: [
    ConfigModule.forRoot({isGlobal:true,}), 
    Neo4jModule,
    AuthModule,
    MallaModule,
    HttpModule,
    AvanceModule,
  ],
})
export class AppModule {}
