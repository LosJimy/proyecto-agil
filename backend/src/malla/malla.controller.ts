// backend/src/malla/malla.controller.ts
import { Controller, Get, Post, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { MallaService } from './malla.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AvanceService } from '../avance/avance.service'; // ← Importar

@Controller('usuario')
export class MallaController {
  constructor(
    private readonly mallaService: MallaService,
    private readonly avanceService: AvanceService 
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('malla')
  async obtenerMalla(@Request() req) {
    const { carreras } = req.user;

    if (!carreras || carreras.length == 0) {
      throw new NotFoundException('No hay carreras asociadas');
    }

    const ultimaCarrera = carreras.reduce((prev, curr) =>
      parseInt(curr.catalogo) > parseInt(prev.catalogo) ? curr : prev
    );

    console.log('Consultando malla para:', ultimaCarrera.codigo, ultimaCarrera.catalogo);

    return this.mallaService.obtenerMalla(
      ultimaCarrera.codigo,
      ultimaCarrera.catalogo
    );
  }

  // Nuevo endpoint: Cargar malla en Neo4j manualmente
  @UseGuards(JwtAuthGuard)
  @Post('malla/cargar-neo4j')
  async cargarMallaEnNeo4j(@Request() req) {
    const { carreras } = req.user;

    if (!carreras || carreras.length == 0) {
      throw new NotFoundException('No hay carreras asociadas');
    }

    const ultimaCarrera = carreras.reduce((prev, curr) =>
      parseInt(curr.catalogo) > parseInt(prev.catalogo) ? curr : prev
    );

    console.log('Cargando malla en Neo4j:', ultimaCarrera.codigo, ultimaCarrera.catalogo);

    return this.mallaService.cargarMallaEnNeo4j(
      ultimaCarrera.codigo,
      ultimaCarrera.catalogo
    );
  }

  // Nuevo endpoint: Obtener ramos disponibles
  @UseGuards(JwtAuthGuard)
  @Get('malla/disponibles')
  async obtenerRamosDisponibles(@Request() req) {
    const { rut, carreras } = req.user;

    if (!carreras || carreras.length == 0) {
      throw new NotFoundException('No hay carreras asociadas');
    }

    const ultimaCarrera = carreras.reduce((prev, curr) =>
      parseInt(curr.catalogo) > parseInt(prev.catalogo) ? curr : prev
    );
    
    console.log('Obteniendo ramos disponibles para:', rut, ultimaCarrera.codigo);

    // Obtener el avance del usuario (array de AvanceItem)
    const avance = await this.avanceService.obtenerAvance(rut, ultimaCarrera.codigo);
    
    // Filtrar ramos aprobados y extraer códigos
    // Nota: La API retorna 'status' y 'course' en inglés
    const ramosAprobados = avance
      .filter(ramo => ramo.status === 'APROBADO')
      .map(ramo => ramo.course);

    console.log('Ramos aprobados encontrados:', ramosAprobados.length);

    // Pasar el array de códigos de ramos aprobados
    return this.mallaService.obtenerRamosDisponibles(ramosAprobados);
  }
}



