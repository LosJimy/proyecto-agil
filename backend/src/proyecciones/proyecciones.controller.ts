// backend/src/proyecciones/proyecciones.controller.ts 
import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { ProyeccionesService } from './proyecciones.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CrearProyeccionDto } from './dto/crear-proyeccion.dto';

@Controller('proyecciones')
export class ProyeccionesController {
  constructor(private readonly proyeccionesService: ProyeccionesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async crear(@Request() req, @Body() dto: CrearProyeccionDto) {
    console.log('📥 DTO recibido:', dto);
    console.log('👤 Usuario:', req.user); 
    
    const { rut, carreras } = req.user;

    if (!carreras || carreras.length === 0) {
      throw new NotFoundException('No hay carreras asociadas');
    }

    const ultimaCarrera = carreras.reduce((prev, curr) =>
      parseInt(curr.catalogo) > parseInt(prev.catalogo) ? curr : prev
    );

    console.log('💾 Datos a guardar:', { rut, carrera: ultimaCarrera.codigo, dto });

    return this.proyeccionesService.crear(rut, ultimaCarrera.codigo, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async obtenerTodas(@Request() req) {
    const { rut, carreras } = req.user;

    if (!carreras || carreras.length === 0) {
      throw new NotFoundException('No hay carreras asociadas');
    }

    const ultimaCarrera = carreras.reduce((prev, curr) =>
      parseInt(curr.catalogo) > parseInt(prev.catalogo) ? curr : prev
    );

    return this.proyeccionesService.obtenerPorEstudiante(rut, ultimaCarrera.codigo);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async obtenerPorId(@Request() req, @Param('id') id: string) {
    const { rut } = req.user;
    const proyeccion = await this.proyeccionesService.obtenerPorId(id, rut);
    
    if (!proyeccion) {
      throw new NotFoundException('Proyección no encontrada');
    }
    
    return proyeccion;
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async actualizar(
    @Request() req, 
    @Param('id') id: string, 
    @Body() dto: Partial<CrearProyeccionDto>
  ) {
    const { rut } = req.user;
    const actualizada = await this.proyeccionesService.actualizar(id, rut, dto);
    
    if (!actualizada) {
      throw new NotFoundException('Proyección no encontrada');
    }
    
    return actualizada;
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async eliminar(@Request() req, @Param('id') id: string) {
    const { rut } = req.user;
    const eliminada = await this.proyeccionesService.eliminar(id, rut);
    
    if (!eliminada) {
      throw new NotFoundException('Proyección no encontrada');
    }
    
    return { mensaje: 'Proyección eliminada exitosamente' };
  }
}