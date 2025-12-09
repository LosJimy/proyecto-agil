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
   * Los prerrequisitos son ALTERNATIVOS (OR) - requiere AL MENOS UNO
   */
  obtenerRamosDisponibles(
    mallaCurricular: Ramo[],
    ramosAprobados: string[]
  ): Ramo[] {
    return mallaCurricular.filter(ramo => {
      if (ramosAprobados.includes(ramo.codigo)) return false;
      const prereqs = this.obtenerPrerrequisitos(ramo);
      // Si no tiene prerrequisitos, está disponible
      if (prereqs.length === 0) return true;
      // Si tiene prerrequisitos, necesita AL MENOS UNO aprobado (OR)
      return prereqs.some(p => ramosAprobados.includes(p));
    });
  }

/**
   * Calcular la proyección óptima para egresar lo más rápido posible
   */
  calcularProyeccionOptima(
    mallaCurricular: Ramo[],
    ramosAprobados: string[],
    maxCreditosPorSemestre: number = 30,
    minCreditosPorSemestre: number = 20
  ): ProyeccionOptima {
    // Normalizar la malla
    const malla = mallaCurricular.map(r => ({
      codigo: String(r.codigo).trim(),
      asignatura: String(r.asignatura || '').trim(),
      creditos: typeof r.creditos === 'number' ? r.creditos : Number(String(r.creditos).replace(',', '.')) || 0,
      nivel: typeof r.nivel === 'number' ? r.nivel : Number(String(r.nivel)) || 0,
      prereq: String(r.prereq || '').trim(),
    }));
 
    const ramosPendientes = malla.filter(ramo => !ramosAprobados.includes(ramo.codigo));
    
    if (ramosPendientes.length === 0) {
      return {
        semestres: [],
        totalSemestres: 0,
        totalCreditos: 0,
        sePuedeEgresar: true,
        ramosBloqueados: [],
      };
    }
    
    // Identificar Capstone
    const nivelMaximo = Math.max(...malla.map(r => r.nivel));
    const ramosCapstone = malla.filter(r => 
      r.nivel === nivelMaximo && 
      (r.codigo.toLowerCase().includes('capstone') || 
      r.codigo.toLowerCase().includes('proyecto') ||
      r.asignatura.toLowerCase().includes('capstone'))
    );
    
    console.log(`📚 Nivel máximo: ${nivelMaximo}`);
    if (ramosCapstone.length > 0) {
      console.log(`🎓 Capstone: ${ramosCapstone.map(r => r.codigo).join(', ')}`);
    }
    
    // Helper: es electivo
    const esElectivo = (ramo: any) => {
      const nombreLower = ramo.asignatura.toLowerCase();
      return nombreLower.includes('electiv') || 
             nombreLower.includes('formación profesional') ||
             nombreLower.includes('formacion profesional');
    };
    
    // Calcular métricas para todos los ramos
    const ramosConPrioridad = ramosPendientes.map(ramo => {
      const prereqs = this.obtenerPrerrequisitos(ramo);
      const prereqsPendientes = prereqs.filter(p => !ramosAprobados.includes(p));
      
      const ramosSiguientes = ramosPendientes.filter(r => {
        const reqsDeR = this.obtenerPrerrequisitos(r);
        return reqsDeR.includes(ramo.codigo);
      }).length;
      
      const esCapstone = ramosCapstone.some(c => c.codigo === ramo.codigo);
      const puedeTomarseAhora = prereqs.length === 0 || prereqs.some(p => ramosAprobados.includes(p));
      
      return {
        ...ramo,
        prereqsPendientes: prereqsPendientes.length,
        ramosSiguientes,
        puedeTomarseAhora,
        esCapstone,
        esElectivo: esElectivo(ramo),
      };
    });
    
    // Separar Capstones (van al final siempre)
    const capstones = ramosConPrioridad.filter(r => r.esCapstone);
    const ramosNormales = ramosConPrioridad.filter(r => !r.esCapstone);
    
    console.log(`📊 Total ramos pendientes: ${ramosPendientes.length}`);
    console.log(`   - Ramos normales: ${ramosNormales.length}`);
    console.log(`   - Capstones: ${capstones.length}`);
    
    const semestres: SemestreOptimizado[] = [];
    const aprobadosSimulados = new Set(ramosAprobados);
    const asignados = new Set<string>();
    let semestreNumero = 1;
    
    // ALGORITMO UNIFICADO: Llenar semestre por semestre hasta el máximo
    console.log(`\n🔄 Distribuyendo todos los ramos semestre por semestre...`);
    
    const maxIteraciones = 30;
    let iteraciones = 0;
    
    while (asignados.size < ramosNormales.length && iteraciones < maxIteraciones) {
      iteraciones++;
      
      // 1. Obtener ramos disponibles (prereqs cumplidos)
      let disponibles = ramosNormales
        .filter(ramo => {
          if (asignados.has(ramo.codigo)) return false;
          const prereqs = this.obtenerPrerrequisitos(ramo);
          if (prereqs.length === 0) return true;
          return prereqs.some(p => aprobadosSimulados.has(p));
        });
      
      if (disponibles.length === 0) {
        const pendientes = ramosNormales.filter(r => !asignados.has(r.codigo));
        if (pendientes.length === 0) break;
        
        const nivelMasBajo = Math.min(...pendientes.map(r => r.nivel));
        console.warn(`⚠️ Bloqueo en semestre ${semestreNumero}. Forzando nivel ${nivelMasBajo}`);
        
        disponibles = pendientes
          .filter(r => r.nivel === nivelMasBajo)
          .map(r => ({ ...r, advertencia: true }));
        
        if (disponibles.length === 0) break;
      }
      
      // 2. Ordenar por prioridad: que desbloquean más → nivel bajo → créditos altos
      const disponiblesTyped: Array<typeof ramosConPrioridad[0] & { advertencia?: boolean }> = disponibles.map(d => ({ ...d, advertencia: (d as any).advertencia }));
      disponiblesTyped.sort((a, b) => {
        if (a.ramosSiguientes !== b.ramosSiguientes) {
          return b.ramosSiguientes - a.ramosSiguientes;
        }
        if (a.nivel !== b.nivel) {
          return a.nivel - b.nivel;
        }
        return b.creditos - a.creditos;
      });
      
      // 3. Llenar semestre COMPLETO usando algoritmo greedy
      const semestreActual: SemestreOptimizado['ramos'] = [];
      let creditosActuales = 0;
      
      console.log(`\n📦 Semestre ${semestreNumero} (disponibles: ${disponibles.length})`);
      // 3a. FASE CRÍTICA: Agregar ramos de alta prioridad (desbloquean otros)
      const ramosAltaPrioridad = disponiblesTyped.filter(r => r.ramosSiguientes > 0);
      for (const ramo of ramosAltaPrioridad) {
        if (creditosActuales + ramo.creditos <= maxCreditosPorSemestre) {
          semestreActual.push({
            codigo: ramo.codigo,
            asignatura: ramo.asignatura,
            creditos: ramo.creditos,
            nivel: ramo.nivel,
            razon: ramo.advertencia 
              ? '⚠️ Forzado por bloqueo' 
              : `🔑 Desbloquea ${ramo.ramosSiguientes} ramo(s)`,
          });
          creditosActuales += ramo.creditos;
          asignados.add(ramo.codigo);
          aprobadosSimulados.add(ramo.codigo);
          console.log(`   ✓ ${ramo.codigo} (${ramo.creditos} SCT) - Desbloquea ${ramo.ramosSiguientes}`);
        }
      }
      // 3b. LLENADO GREEDY: Agregar lo que quepa hasta el máximo
      const ramosRestantes = disponiblesTyped.filter(r => !asignados.has(r.codigo));      
      // Ordenar por créditos descendente para mejor empaquetamiento
      ramosRestantes.sort((a, b) => b.creditos - a.creditos);
      
      for (const ramo of ramosRestantes) {
        if (creditosActuales + ramo.creditos <= maxCreditosPorSemestre) {
          const razon = ramo.esElectivo 
            ? '📚 Electivo' 
            : (ramo.ramosSiguientes === 0 ? '🏁 Terminal' : 'Disponible');
            
          semestreActual.push({
            codigo: ramo.codigo,
            asignatura: ramo.asignatura,
            creditos: ramo.creditos,
            nivel: ramo.nivel,
            razon: ramo.advertencia ? '⚠️ Forzado por bloqueo' : razon,
          });
          creditosActuales += ramo.creditos;
          asignados.add(ramo.codigo);
          aprobadosSimulados.add(ramo.codigo);
          console.log(`   ✓ ${ramo.codigo} (${ramo.creditos} SCT) - ${razon}`);
        }
      }
      
      // 3c. Si no alcanzamos el mínimo, intentar con ramos más pequeños
      if (creditosActuales < minCreditosPorSemestre) {
        const ramosPequenos = ramosRestantes
          .filter(r => !asignados.has(r.codigo))
          .sort((a, b) => a.creditos - b.creditos);
        
        for (const ramo of ramosPequenos) {
          if (creditosActuales + ramo.creditos <= maxCreditosPorSemestre) {
            semestreActual.push({
              codigo: ramo.codigo,
              asignatura: ramo.asignatura,
              creditos: ramo.creditos,
              nivel: ramo.nivel,
              razon: 'Completar carga mínima',
            });
            creditosActuales += ramo.creditos;
            asignados.add(ramo.codigo);
            aprobadosSimulados.add(ramo.codigo);
            console.log(`   ✓ ${ramo.codigo} (${ramo.creditos} SCT) - Carga mínima`);
            
            if (creditosActuales >= minCreditosPorSemestre) break;
          }
        }
      }
      
      if (semestreActual.length === 0) break;
      
      console.log(`   📊 Total semestre: ${creditosActuales}/${maxCreditosPorSemestre} SCT, ${semestreActual.length} ramos`);
      
      semestres.push({
        numero: semestreNumero++,
        ramos: semestreActual,
        totalCreditos: creditosActuales,
      });
    }
    
    // FASE FINAL: Agregar CAPSTONE
    console.log(`\n🎓 Agregando Capstone al final...`);
    if (capstones.length > 0) {
      const capstonesPendientes = capstones.filter(r => !asignados.has(r.codigo));
      
      if (capstonesPendientes.length > 0) {
        semestres.push({
          numero: semestreNumero++,
          ramos: capstonesPendientes.map(r => ({
            codigo: r.codigo,
            asignatura: r.asignatura,
            creditos: r.creditos,
            nivel: r.nivel,
            razon: '🎓 Proyecto Final - Capstone',
          })),
          totalCreditos: capstonesPendientes.reduce((sum, r) => sum + r.creditos, 0),
        });
        capstonesPendientes.forEach(r => asignados.add(r.codigo));
      }
    }
    
    const ramosBloqueados = ramosPendientes
      .filter(r => !asignados.has(r.codigo))
      .map(r => r.codigo);
    
    if (ramosBloqueados.length > 0) {
      console.warn(`⚠️ ${ramosBloqueados.length} ramos bloqueados:`, ramosBloqueados);
    }
    
    const totalCreditos = ramosPendientes.reduce((sum, r) => sum + r.creditos, 0);
    
    console.log(`\n✅ Proyección completada:`);
    console.log(`   - Total semestres: ${semestres.length}`);
    console.log(`   - Ramos asignados: ${asignados.size}/${ramosPendientes.length}`);
    console.log(`   - Ramos bloqueados: ${ramosBloqueados.length}`);
    
    return {
      semestres,
      totalSemestres: semestres.length,
      totalCreditos,
      sePuedeEgresar: ramosBloqueados.length === 0,
      ramosBloqueados,
    };
  }
    
  private obtenerPrerrequisitos(ramo: Ramo | { prereq: string }): string[] {
    if (!ramo.prereq || ramo.prereq.trim() === '') return [];
    return ramo.prereq.split(',').map(p => p.trim()).filter(p => p);
  }
  
  private compararPrioridad(a: any, b: any): number {
    if (a.ramosSiguientes !== b.ramosSiguientes) {
      return b.ramosSiguientes - a.ramosSiguientes;
    }
    if (a.nivel !== b.nivel) {
      return a.nivel - b.nivel;
    }
    if (a.creditos !== b.creditos) {
      return b.creditos - a.creditos;
    }
    return a.codigo.localeCompare(b.codigo);
  }
  
  private armarSemestre(
    disponibles: any[],
    maxCreditos: number,
    minCreditos: number,
    electivosCandidatos: any[] = []
  ): Omit<SemestreOptimizado, 'numero'> {
    const ramos: SemestreOptimizado['ramos'] = [];
    let creditosActuales = 0;
    
    const disponiblesSinTerminales = disponibles.filter(r => !r.esTerminal);
    
    // FASE 1: Ramos de alta prioridad
    const ramosAlta = disponiblesSinTerminales
      .filter(r => r.ramosSiguientes > 0)
      .sort((a, b) => {
        if (a.ramosSiguientes !== b.ramosSiguientes) {
          return b.ramosSiguientes - a.ramosSiguientes;
        }
        return a.nivel - b.nivel;
      });
    
    for (const ramo of ramosAlta) {
      if (creditosActuales + ramo.creditos <= maxCreditos) {
        ramos.push({
          codigo: ramo.codigo,
          asignatura: ramo.asignatura,
          creditos: ramo.creditos,
          nivel: ramo.nivel,
          razon: ramo.advertencia 
            ? '⚠️ Agregado por nivel - Verificar prerrequisitos' 
            : this.obtenerRazonSeleccion(ramo),
        });
        creditosActuales += ramo.creditos;
      }
    }
    
    // INTENTAR AGREGAR UN ELECTIVO (1) SI HAY CANDIDATO QUE QUEPA Y AÚN NO HAY ELECTIVO EN ESTE SEMESTRE
    if (electivosCandidatos && electivosCandidatos.length > 0) {
      const yaTieneElectivo = ramos.some(rr => {
        const lower = (rr.asignatura || '').toString().toLowerCase();
        return lower.includes('electiv') || lower.includes('formación profesional') || lower.includes('formacion profesional');
      });
      if (!yaTieneElectivo) {
        const candidato = electivosCandidatos.find(e => creditosActuales + e.creditos <= maxCreditos);
        if (candidato) {
          ramos.push({
            codigo: candidato.codigo,
            asignatura: candidato.asignatura,
            creditos: candidato.creditos,
            nivel: candidato.nivel,
            razon: '📚 Electivo reservado al generar semestre',
          });
          creditosActuales += candidato.creditos;
        }
      }
    }
    
    // FASE 2: Llenar con ramos restantes
    const ramosRestantes = disponiblesSinTerminales
      .filter(r => !ramos.some(asignado => asignado.codigo === r.codigo))
      .sort((a, b) => {
        if (a.nivel !== b.nivel) return a.nivel - b.nivel;
        return b.creditos - a.creditos;
      });
    
    for (const ramo of ramosRestantes) {
      if (creditosActuales + ramo.creditos <= maxCreditos) {
        ramos.push({
          codigo: ramo.codigo,
          asignatura: ramo.asignatura,
          creditos: ramo.creditos,
          nivel: ramo.nivel,
          razon: ramo.advertencia 
            ? '⚠️ Agregado por nivel - Verificar prerrequisitos' 
            : this.obtenerRazonSeleccion(ramo),
        });
        creditosActuales += ramo.creditos;
      }
    }
    
    // FASE 3: Completar carga mínima
    if (creditosActuales < minCreditos && ramos.length < disponiblesSinTerminales.length) {
      const ramosPequenos = disponiblesSinTerminales
        .filter(r => !ramos.some(asignado => asignado.codigo === r.codigo))
        .sort((a, b) => a.creditos - b.creditos);
      
      for (const ramo of ramosPequenos) {
        if (creditosActuales + ramo.creditos <= maxCreditos) {
          ramos.push({
            codigo: ramo.codigo,
            asignatura: ramo.asignatura,
            creditos: ramo.creditos,
            nivel: ramo.nivel,
            razon: ramo.advertencia 
              ? '⚠️ Agregado por nivel - Verificar prerrequisitos' 
              : 'Completar carga mínima',
          });
          creditosActuales += ramo.creditos;
          
          if (creditosActuales >= minCreditos) break;
        }
      }
    }
    
    // PASO FINAL: intentar rellenar al máximo con cualquier disponible restante (greedy)
    const restantesParaRellenar = disponiblesSinTerminales.filter(r => !ramos.some(rr => rr.codigo === r.codigo));
    // ordenar por crédito descendente para mejorar compactación
    restantesParaRellenar.sort((a, b) => b.creditos - a.creditos);
    for (const ramo of restantesParaRellenar) {
      if (creditosActuales + ramo.creditos <= maxCreditos) {
        ramos.push({
          codigo: ramo.codigo,
          asignatura: ramo.asignatura,
          creditos: ramo.creditos,
          nivel: ramo.nivel,
          razon: 'Relleno greedy',
        });
        creditosActuales += ramo.creditos;
      }
    }
    
    return {
      ramos,
      totalCreditos: creditosActuales,
    };
  }
  
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