// backend/src/malla/optimizacion.service.ts

import { Injectable } from '@nestjs/common';

export interface Ramo {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  prereq: string;
}

export interface SemestreOptimizado {
  numero: number;
  ramos: {
    codigo: string;
    asignatura: string;
    creditos: number;
    nivel: number;
    razon: string;
  }[];
  totalCreditos: number;
}

export interface ProyeccionOptima {
  semestres: SemestreOptimizado[];
  totalSemestres: number;
  totalCreditos: number;
  sePuedeEgresar: boolean;
  ramosBloqueados: string[];
}

@Injectable()
export class OptimizacionService {
  
  /**
   * Obtener ramos disponibles para cursar (prerrequisitos cumplidos)
   */
  obtenerRamosDisponibles(
    mallaCurricular: Ramo[],
    ramosAprobados: string[]
  ): Ramo[] {
    return mallaCurricular.filter(ramo => {
      // No mostrar ramos ya aprobados
      if (ramosAprobados.includes(ramo.codigo)) return false;
      
      // Verificar prerrequisitos
      const prereqs = this.obtenerPrerrequisitos(ramo);
      return prereqs.every(p => ramosAprobados.includes(p));
    });
  }

  /**
   * Calcular la proyección óptima para egresar lo más rápido posible
   * Incluye TODOS los ramos pendientes respetando prerrequisitos
   */
  calcularProyeccionOptima(
    mallaCurricular: Ramo[],
    ramosAprobados: string[],
    maxCreditosPorSemestre: number = 30,
    minCreditosPorSemestre: number = 20
  ): ProyeccionOptima {
    
    // 1. Obtener ramos pendientes
    const ramosPendientes = mallaCurricular.filter(
      ramo => !ramosAprobados.includes(ramo.codigo)
    );
    
    if (ramosPendientes.length === 0) {
      return {
        semestres: [],
        totalSemestres: 0,
        totalCreditos: 0,
        sePuedeEgresar: true,
        ramosBloqueados: [],
      };
    }
    
    // 2. Crear un mapa de ramos para acceso rápido
    const mapaRamos = new Map<string, Ramo>();
    mallaCurricular.forEach(ramo => mapaRamos.set(ramo.codigo, ramo));
    
    // 3. Calcular métricas para cada ramo pendiente
    const ramosConPrioridad = ramosPendientes.map(ramo => {
      const prereqs = this.obtenerPrerrequisitos(ramo);
      const prereqsPendientes = prereqs.filter(p => !ramosAprobados.includes(p));
      
      // ¿Cuántos ramos desbloquea este ramo?
      const ramosSiguientes = ramosPendientes.filter(r => {
        const reqsDeR = this.obtenerPrerrequisitos(r);
        return reqsDeR.includes(ramo.codigo);
      }).length;
      
      return {
        ...ramo,
        prereqsPendientes: prereqsPendientes.length,
        ramosSiguientes,
        puedeTomarseAhora: prereqsPendientes.length === 0,
      };
    });
    
    // 4. Distribuir TODOS los ramos en semestres
    const semestres: SemestreOptimizado[] = [];
    const aprobadosSimulados = new Set(ramosAprobados);
    const asignados = new Set<string>();
    let semestreNumero = 1;
    
    // Límite de seguridad para evitar loops infinitos
    const maxIteraciones = 30;
    let iteraciones = 0;
    
    while (asignados.size < ramosPendientes.length && iteraciones < maxIteraciones) {
      iteraciones++;
      
      // Obtener ramos disponibles para este semestre
      const disponibles = ramosConPrioridad
        .filter(ramo => {
          if (asignados.has(ramo.codigo)) return false;
          const prereqs = this.obtenerPrerrequisitos(ramo);
          return prereqs.every(p => aprobadosSimulados.has(p));
        })
        .sort((a, b) => this.compararPrioridad(a, b));
      
      if (disponibles.length === 0) {
        // No hay más ramos disponibles - hay un bloqueo circular
        console.error('⚠️ Bloqueo detectado. Ramos pendientes:', 
          ramosPendientes.filter(r => !asignados.has(r.codigo)).map(r => r.codigo)
        );
        break;
      }
      
      // Armar el semestre respetando límites de créditos
      const semestreActual = this.armarSemestre(
        disponibles,
        maxCreditosPorSemestre,
        minCreditosPorSemestre
      );
      
      if (semestreActual.ramos.length === 0) {
        console.error('⚠️ No se pudieron armar más semestres');
        break;
      }
      
      // Marcar ramos como asignados y "aprobados" para la simulación
      semestreActual.ramos.forEach(ramo => {
        asignados.add(ramo.codigo);
        aprobadosSimulados.add(ramo.codigo);
      });
      
      semestres.push({
        ...semestreActual,
        numero: semestreNumero++,
      });
    }
    
    // 5. Identificar ramos que no se pudieron asignar (bloqueados por ciclos o errores)
    const ramosBloqueados = ramosPendientes
      .filter(r => !asignados.has(r.codigo))
      .map(r => r.codigo);
    
    if (ramosBloqueados.length > 0) {
      console.warn('⚠️ Ramos bloqueados detectados:', ramosBloqueados);
    }
    
    const totalCreditos = ramosPendientes.reduce((sum, r) => sum + r.creditos, 0);
    
    return {
      semestres,
      totalSemestres: semestres.length,
      totalCreditos,
      sePuedeEgresar: ramosBloqueados.length === 0,
      ramosBloqueados,
    };
  }
  
  /**
   * Obtener lista de prerrequisitos de un ramo
   */
  private obtenerPrerrequisitos(ramo: Ramo): string[] {
    if (!ramo.prereq || ramo.prereq.trim() === '') return [];
    return ramo.prereq.split(',').map(p => p.trim()).filter(p => p);
  }
  
  /**
   * Comparar prioridad entre dos ramos
   */
  private compararPrioridad(a: any, b: any): number {
    // 1. Prioridad: ramos que desbloquean más materias
    if (a.ramosSiguientes !== b.ramosSiguientes) {
      return b.ramosSiguientes - a.ramosSiguientes;
    }
    
    // 2. Prioridad: nivel más bajo (seguir orden natural de la malla)
    if (a.nivel !== b.nivel) {
      return a.nivel - b.nivel;
    }
    
    // 3. Prioridad: más créditos primero (para llenar semestres eficientemente)
    if (a.creditos !== b.creditos) {
      return b.creditos - a.creditos;
    }
    
    // 4. Alfabético por código como último criterio
    return a.codigo.localeCompare(b.codigo);
  }
  
  /**
   * Armar un semestre optimizado
   * Intenta llenar el semestre lo más posible sin exceder maxCreditos
   */
  private armarSemestre(
    disponibles: any[],
    maxCreditos: number,
    minCreditos: number
  ): Omit<SemestreOptimizado, 'numero'> {
    const ramos: SemestreOptimizado['ramos'] = [];
    let creditosActuales = 0;
    
    // Primera pasada: agregar ramos de mayor a menor prioridad hasta el máximo
    for (const ramo of disponibles) {
      if (creditosActuales + ramo.creditos <= maxCreditos) {
        ramos.push({
          codigo: ramo.codigo,
          asignatura: ramo.asignatura,
          creditos: ramo.creditos,
          nivel: ramo.nivel,
          razon: this.obtenerRazonSeleccion(ramo),
        });
        creditosActuales += ramo.creditos;
      }
    }
    
    // Si no se alcanzó el mínimo, intentar agregar ramos pequeños
    if (creditosActuales < minCreditos && ramos.length < disponibles.length) {
      const ramosRestantes = disponibles.filter(r => 
        !ramos.some(asignado => asignado.codigo === r.codigo)
      );
      
      for (const ramo of ramosRestantes) {
        if (creditosActuales + ramo.creditos <= maxCreditos) {
          ramos.push({
            codigo: ramo.codigo,
            asignatura: ramo.asignatura,
            creditos: ramo.creditos,
            nivel: ramo.nivel,
            razon: this.obtenerRazonSeleccion(ramo),
          });
          creditosActuales += ramo.creditos;
        }
      }
    }
    
    if (creditosActuales < maxCreditos){
      const terminales = disponibles.filter(r => r.ramosSiguientes == 0);
      for (const ramo of terminales){
        if(!ramos.some(asignado => asignado.codigo == ramo.codigo) &&
      creditosActuales + ramo.creditos <= maxCreditos){
        ramos.push({
          codigo: ramo.codigo,
          asignatura: ramo.asignatura,
          creditos: ramo.creditos,
          nivel: ramo.nivel,
          razon: 'Ramo terminal (no desbloquea otros)',
        });
        creditosActuales += ramo.creditos;
      }
      }
    }

    return {
      ramos,
      totalCreditos: creditosActuales,
    };
  }
  
  /**
   * Explicar por qué se seleccionó este ramo
   */
  private obtenerRazonSeleccion(ramo: any): string {
    if (ramo.ramosSiguientes > 3) {
      return `Desbloquea ${ramo.ramosSiguientes} ramos`;
    }
    if (ramo.ramosSiguientes > 0) {
      return `Desbloquea ${ramo.ramosSiguientes} ramo(s)`;
    }
    if (ramo.nivel <= 3) {
      return 'Ramo fundamental de nivel básico';
    }
    return 'Disponible para cursar';
  }
}