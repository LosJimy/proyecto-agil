// backend/src/neo4j/neo4j.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import neo4j, { Driver, Session } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
  private driver: Driver;

  async onModuleInit() {
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password123';

    this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

    try {
      await this.driver.verifyConnectivity();
      console.log('Conectado a Neo4j');
    } catch (error) {
      console.error('Error conectando a Neo4j:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.driver.close();
    console.log('Conexión a Neo4j cerrada');
  }

  getSession(): Session {
    return this.driver.session();
  }

  async runQuery(query: string, params = {}) {
    const session = this.getSession();
    try {
      const result = await session.run(query, params);
      return result.records;
    } finally {
      await session.close();
    }
  }

  // Limpiar toda la base de datos (solo para desarrollo)
  async limpiarBaseDatos() {
    const session = this.getSession();
    try {
      await session.run('MATCH (n) DETACH DELETE n');
      console.log('Base de datos Neo4j limpiada');
    } finally {
      await session.close();
    }
  }

  // Cargar un ramo en Neo4j
  async cargarRamo(ramo: {
    codigo: string;
    asignatura: string;
    creditos: number;
    nivel: number;
    prereq: string;
  }) {
    const session = this.getSession();
    try {
      // Crear el nodo del ramo
      const query = `
        MERGE (r:Ramo {codigo: $codigo})
        SET r.asignatura = $asignatura,
            r.creditos = $creditos,
            r.nivel = $nivel
        RETURN r
      `;

      await session.run(query, {
        codigo: ramo.codigo,
        asignatura: ramo.asignatura,
        creditos: ramo.creditos,
        nivel: ramo.nivel,
      });

      // Si tiene prerrequisitos, crear las relaciones
      if (ramo.prereq && ramo.prereq.trim() !== '') {
        const prerrequisitos = ramo.prereq.split(',').map(p => p.trim());
        
        for (const prereqCodigo of prerrequisitos) {
          const relQuery = `
            MATCH (ramo:Ramo {codigo: $codigo})
            MERGE (prereq:Ramo {codigo: $prereqCodigo})
            MERGE (ramo)-[:REQUIERE]->(prereq)
          `;
          
          await session.run(relQuery, {
            codigo: ramo.codigo,
            prereqCodigo,
          });
        }
      }
    } finally {
      await session.close();
    }
  }

  // Cargar toda la malla en Neo4j
  async cargarMallaCompleta(ramos: any[]) {
    console.log(`Cargando ${ramos.length} ramos en Neo4j...`);
    
    for (const ramo of ramos) {
      await this.cargarRamo(ramo);
    }
    
    console.log('Malla cargada exitosamente en Neo4j');
  }

  // Obtener ramos disponibles para tomar (sin prerrequisitos pendientes)
  async obtenerRamosDisponibles(ramosAprobados: string[]) {
    const session = this.getSession();
    try {
      const query = `
        MATCH (disponible:Ramo)
        WHERE NOT (disponible)-[:REQUIERE]->()
           OR ALL(prereq IN [(disponible)-[:REQUIERE]->(r:Ramo) | r.codigo]
                  WHERE prereq IN $ramosAprobados)
        AND NOT disponible.codigo IN $ramosAprobados
        RETURN disponible
        ORDER BY disponible.nivel
      `;

      const result = await session.run(query, { ramosAprobados });
      return result.records.map(record => record.get('disponible').properties);
    } finally {
      await session.close();
    }
  }

  // Verificar si la base de datos tiene ramos cargados
  async tieneRamosCargados(): Promise<boolean> {
    const session = this.getSession();
    try {
      const result = await session.run('MATCH (r:Ramo) RETURN count(r) as total');
      const total = result.records[0].get('total').toNumber();
      return total > 0;
    } finally {
      await session.close();
    }
  }
}