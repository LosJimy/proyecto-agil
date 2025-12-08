// backend/src/proyecciones/schemas/proyeccion.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProyeccionDocument = Proyeccion & Document;

@Schema({ timestamps: true })
export class Proyeccion {
  @Prop({ required: true })
  rut: string;

  @Prop({ required: true })
  carrera: string;

  @Prop({ required: true })
  nombre: string;

  @Prop({ type: Array, required: true })
  semestres: Array<{
    numero: number;
    ramos: Array<{
      codigo: string;
      asignatura: string;
      creditos: number;
      nivel: number;
      razon?: string;
    }>;
    totalCreditos: number;
  }>;

  @Prop({ required: true })
  totalSemestres: number;

  @Prop({ required: true })
  totalCreditos: number;

  // Estos campos se generan automáticamente con timestamps: true
  createdAt?: Date;
  updatedAt?: Date;
}

export const ProyeccionSchema = SchemaFactory.createForClass(Proyeccion);

// Índices para mejorar rendimiento
ProyeccionSchema.index({ rut: 1, carrera: 1 });