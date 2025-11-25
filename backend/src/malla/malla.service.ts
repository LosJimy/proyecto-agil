// backend/src/malla/malla.service.ts
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import axios from 'axios';
import { Neo4jService } from '../neo4j/neo4j.service';
import { AvanceService } from '../avance/avance.service';  // ← Importar

// Interface para definir la estructura de un ramo
export interface Ramo {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  prereq: string;
}

@Injectable()
export class MallaService {
  constructor(
    private readonly neo4jService: Neo4jService,
    private readonly avanceService: AvanceService  // ← Inyectar
  ) {}

  async obtenerMalla(codigo: string, catalogo: string): Promise<Ramo[]> {
    const url = `https://losvilos.ucn.cl/hawaii/api/mallas/?${codigo}-${catalogo}`;

    try {
      const respuesta = await axios.get<Ramo[]>(url, {
        headers: {
          'X-HAWAII-AUTH': 'jf400fejof13f'
        }
      });

      // Verificar si ya está cargada en Neo4j
      const yaExiste = await this.neo4jService.tieneRamosCargados();
      
      if (!yaExiste && respuesta.data && respuesta.data.length > 0) {
        console.log('Cargando malla en Neo4j por primera vez...');
        await this.neo4jService.cargarMallaCompleta(respuesta.data);
      }

      return respuesta.data;
    } catch (error) {
      if (error.response?.status == 401) {
        throw new UnauthorizedException('No autorizado para acceder a la malla');
      } else if (error.response?.status == 404) {
        throw new NotFoundException('No existe la página');
      }
      throw error;
    }
  }

  // Nuevo método: Cargar malla manualmente en Neo4j
  async cargarMallaEnNeo4j(codigo: string, catalogo: string) {
    const malla = await this.obtenerMalla(codigo, catalogo);
    await this.neo4jService.limpiarBaseDatos();
    await this.neo4jService.cargarMallaCompleta(malla);
    return { mensaje: 'Malla cargada exitosamente en Neo4j', total: malla.length };
  }

  // Nuevo método: Obtener ramos disponibles según ramos aprobados
  async obtenerRamosDisponibles(ramosAprobados: string[]) {
    return this.neo4jService.obtenerRamosDisponibles(ramosAprobados);
  }
}