import { Controller, Get, UseGuards, Request, NotFoundException, Param } from '@nestjs/common';
import { MallaService } from './malla.service';
import { OptimizacionService } from './optimizacion.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AvanceService } from '../avance/avance.service';

@Controller('usuario')
export class MallaController {
  constructor(
    private readonly mallaService: MallaService,
    private readonly optimizacionService: OptimizacionService,
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

    // Obtener malla y avance
    const [malla, avance] = await Promise.all([
      this.mallaService.obtenerMalla(ultimaCarrera.codigo, ultimaCarrera.catalogo),
      this.avanceService.obtenerAvance(rut, ultimaCarrera.codigo)
    ]);
    
    const ramosAprobados = avance
      .filter(ramo => ramo.status === 'APROBADO')
      .map(ramo => ramo.course);

    console.log('Ramos aprobados encontrados:', ramosAprobados.length);

    return this.optimizacionService.obtenerRamosDisponibles(malla, ramosAprobados);
  }

  @UseGuards(JwtAuthGuard)
  @Get('malla/optimizar')
  async optimizarRuta(@Request() req) {
    const { rut, carreras } = req.user;

    if (!carreras || carreras.length == 0) {
      throw new NotFoundException('No hay carreras asociadas');
    }

    const ultimaCarrera = carreras.reduce((prev, curr) =>
      parseInt(curr.catalogo) > parseInt(prev.catalogo) ? curr : prev
    );

    console.log('Optimizando ruta para:', rut, ultimaCarrera.codigo);

    // Obtener malla y avance
    const [malla, avance] = await Promise.all([
      this.mallaService.obtenerMalla(ultimaCarrera.codigo, ultimaCarrera.catalogo),
      this.avanceService.obtenerAvance(rut, ultimaCarrera.codigo)
    ]);
    
    const ramosAprobados = avance
      .filter(ramo => ramo.status === 'APROBADO')
      .map(ramo => ramo.course);

    console.log('Calculando ruta óptima con', ramosAprobados.length, 'ramos aprobados');

    return this.optimizacionService.calcularProyeccionOptima(
      malla, 
      ramosAprobados,
      30, // máximo de créditos por semestre
      25  
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('malla/catalogo/:catalogo')
  async obtenerMallaPorCatalogo(@Request() req, @Param('catalogo') catalogo: string) {
    const { carreras } = req.user;

    if (!carreras || carreras.length == 0) {
      throw new NotFoundException('No hay carreras asociadas');
    }

    // Buscar la carrera que corresponde al catálogo solicitado
    const carreraConCatalogo = carreras.find(c => c.catalogo === catalogo);

    if (!carreraConCatalogo) {
      throw new NotFoundException(`No se encontró carrera con catálogo ${catalogo}`);
    }

    console.log('Consultando malla para catálogo:', catalogo, carreraConCatalogo.codigo);

    return this.mallaService.obtenerMalla(
      carreraConCatalogo.codigo,
      carreraConCatalogo.catalogo
    );
  }
}



