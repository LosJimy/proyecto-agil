// backend/src/proyecciones/proyecciones.service.ts
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Proyeccion, ProyeccionDocument } from './schemas/proyeccion.schema.ts';
import { CrearProyeccionDto } from './dto/crear-proyeccion.dto';

@Injectable()
export class ProyeccionesService {
  constructor(
    @InjectModel(Proyeccion.name)
    private proyeccionModel: Model<ProyeccionDocument>,
  ) {}

  // Crear una nueva proyección
  async crear(
    rut: string,
    carrera: string,
    dto: CrearProyeccionDto,
  ): Promise<ProyeccionDocument> {
    const proyeccion = new this.proyeccionModel({
      rut,
      carrera,
      ...dto,
    });
    return proyeccion.save();
  }

  // Obtener todas las proyecciones de un estudiante
  async obtenerPorEstudiante(
    rut: string,
    carrera: string,
  ): Promise<ProyeccionDocument[]> {
    return this.proyeccionModel
      .find({ rut, carrera })
      .sort({ updatedAt: -1 })
      .exec();
  }

  // Obtener una proyección específica
  async obtenerPorId(
    id: string,
    rut: string,
  ): Promise<ProyeccionDocument | null> {
    return this.proyeccionModel.findOne({ _id: id, rut }).exec();
  }

  // Actualizar una proyección
  async actualizar(
    id: string,
    rut: string,
    dto: Partial<CrearProyeccionDto>,
  ): Promise<ProyeccionDocument | null> {
    return this.proyeccionModel
      .findOneAndUpdate(
        { _id: id, rut },
        { $set: dto },
        { new: true }, // Retorna el documento actualizado
      )
      .exec();
  }

  // Eliminar una proyección
  async eliminar(id: string, rut: string): Promise<boolean> {
    const result = await this.proyeccionModel
      .deleteOne({ _id: id, rut })
      .exec();
    return result.deletedCount > 0;
  }

  // Contar proyecciones de un estudiante
  async contarPorEstudiante(rut: string, carrera: string): Promise<number> {
    return this.proyeccionModel.countDocuments({ rut, carrera }).exec();
  }
}