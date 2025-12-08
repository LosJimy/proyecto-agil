// backend/src/proyecciones/proyecciones.module.tss
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProyeccionesController } from './proyecciones.controller';
import { ProyeccionesService } from './proyecciones.service';
import { Proyeccion, ProyeccionSchema } from './schemas/proyeccion.schema.ts';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Proyeccion.name, schema: ProyeccionSchema }
    ]),
  ],
  controllers: [ProyeccionesController],
  providers: [ProyeccionesService],
  exports: [ProyeccionesService],
})
export class ProyeccionesModule {}