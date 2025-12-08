import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { MallaModule } from 'src/malla/malla.module';
import { HttpModule } from '@nestjs/axios';
import { AvanceModule } from 'src/avance/avance.module';
import { ProyeccionesModule } from 'src/proyecciones/proyecciones.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(
      process.env.MONGO_URI || 'mongodb://mongodb:27017/universidad'
    ),
    AuthModule,
    MallaModule,
    HttpModule,
    AvanceModule,
    ProyeccionesModule,
  ],
})
export class AppModule {}
