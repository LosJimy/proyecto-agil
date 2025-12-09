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
    
    // Identificar el Capstone
    const nivelMaximo = Math.max(...mallaCurricular.map(r => r.nivel));
    const ramosCapstone = mallaCurricular.filter(r => 
      r.nivel === nivelMaximo && 
      (r.codigo.toLowerCase().includes('capstone') || 
      r.codigo.toLowerCase().includes('proyecto') ||
      r.asignatura.toLowerCase().includes('capstone'))
    );
    
    console.log(`📚 Nivel máximo detectado: ${nivelMaximo}`);
    if (ramosCapstone.length > 0) {
      console.log(`🎓 Capstone detectado: ${ramosCapstone.map(r => r.codigo).join(', ')}`);
    }
    
    const mapaRamos = new Map<string, Ramo>();
    mallaCurricular.forEach(ramo => mapaRamos.set(ramo.codigo, ramo));
    
    // Calcular métricas
    const ramosConPrioridad = ramosPendientes.map(ramo => {
      const prereqs = this.obtenerPrerrequisitos(ramo);
      // Filtrar prerrequisitos que NO están aprobados aún
      const prereqsPendientes = prereqs.filter(p => !ramosAprobados.includes(p));
      
      const ramosSiguientes = ramosPendientes.filter(r => {
        const reqsDeR = this.obtenerPrerrequisitos(r);
        return reqsDeR.includes(ramo.codigo);
      }).length;
      
      const esTerminal = ramosSiguientes === 0;
      const esCapstone = ramosCapstone.some(c => c.codigo === ramo.codigo);
      
      // Puede tomarse ahora si NO tiene prereqs O si AL MENOS UNO está aprobado
      const puedeTomarseAhora = prereqs.length === 0 || prereqs.some(p => ramosAprobados.includes(p));
      
      return {
        ...ramo,
        prereqsPendientes: prereqsPendientes.length,
        ramosSiguientes,
        puedeTomarseAhora,
        esTerminal,
        esCapstone,
      };
    });
    
    // Separar categorías
    const ramosCriticos = ramosConPrioridad.filter(r => !r.esTerminal && !r.esCapstone);
    
    // Separar electivos (Formación Profesional Electiva, etc.)
    const esElectivo = (ramo: any) => {
      const nombreLower = ramo.asignatura.toLowerCase();
      return nombreLower.includes('electiv') || 
             nombreLower.includes('formación profesional') ||
             nombreLower.includes('formacion profesional');
    };
    
    // Separar ramos críticos en: normales y electivos
    const ramosCriticosNormales = ramosCriticos.filter(r => !esElectivo(r));
    const ramosElectivos = ramosCriticos.filter(r => esElectivo(r));
    
    const ramosTerminales = ramosConPrioridad.filter(r => r.esTerminal && !r.esCapstone);
    const capstones = ramosConPrioridad.filter(r => r.esCapstone);
    
    console.log(`📊 Distribución:`);
    console.log(`   - Críticos (desbloquean): ${ramosCriticos.length}`);
    console.log(`   - Electivos: ${ramosElectivos.length}`);
    console.log(`   - Terminales: ${ramosTerminales.length}`);
    console.log(`   - Capstone: ${capstones.length}`);
    
    // DEBUG: Mostrar algunos electivos detectados
    if (ramosElectivos.length > 0) {
      console.log(`   📋 Primeros 5 electivos:`);
      ramosElectivos.slice(0, 5).forEach(e => {
        console.log(`      - ${e.codigo}: ${e.asignatura} (${e.creditos} SCT, NF ${e.nivel})`);
      });
    }
    
    const semestres: SemestreOptimizado[] = [];
    const aprobadosSimulados = new Set(ramosAprobados);
    const asignados = new Set<string>();
    let semestreNumero = 1;
    
    const maxIteraciones = 30;
    let iteraciones = 0;
    
    // FASE 1: Distribuir ramos CRÍTICOS (no electivos)
    console.log(`\n🔄 FASE 1: Distribuyendo ramos críticos...`);
    while (asignados.size < ramosCriticos.length && iteraciones < maxIteraciones) {
      iteraciones++;
      
      let disponibles = ramosCriticos
        .filter(ramo => {
          if (asignados.has(ramo.codigo)) return false;
          const prereqs = this.obtenerPrerrequisitos(ramo);
          if (prereqs.length === 0) return true;
          return prereqs.some(p => aprobadosSimulados.has(p));
        })
        .sort((a, b) => this.compararPrioridad(a, b));
      
      if (disponibles.length === 0) {
        const pendientes = ramosCriticos.filter(r => !asignados.has(r.codigo));
        if (pendientes.length === 0) break;
        
        const nivelMasBajo = Math.min(...pendientes.map(r => r.nivel));
        console.warn(`⚠️ Bloqueo en semestre ${semestreNumero}. Agregando nivel ${nivelMasBajo}`);
        
        disponibles = pendientes
          .filter(r => r.nivel === nivelMasBajo)
          .sort((a, b) => this.compararPrioridad(a, b))
          .map(r => ({ ...r, advertencia: true }));
        
        if (disponibles.length === 0) break;
      }
      
      const semestreActual = this.armarSemestre(
        disponibles,
        maxCreditosPorSemestre,
        minCreditosPorSemestre
      );
      
      if (semestreActual.ramos.length === 0) break;
      
      semestreActual.ramos.forEach(ramo => {
        asignados.add(ramo.codigo);
        aprobadosSimulados.add(ramo.codigo);
      });
      
      semestres.push({
        ...semestreActual,
        numero: semestreNumero++,
      });
    }
    
    // FASE 1.5: Insertar ELECTIVOS en los semestres según su nivel
    console.log(`\n📚 FASE 1.5: Distribuyendo electivos por nivel...`);
    if (ramosElectivos.length > 0) {
      const electivosPorNivel = new Map<number, any[]>();
      ramosElectivos.forEach(electivo => {
        if (!electivosPorNivel.has(electivo.nivel)) {
          electivosPorNivel.set(electivo.nivel, []);
        }
        electivosPorNivel.get(electivo.nivel)!.push(electivo);
      });
      
      // Para cada nivel de electivos, intentar insertarlos en semestres correspondientes
      Array.from(electivosPorNivel.entries())
        .sort((a, b) => a[0] - b[0]) 
        .forEach(([nivel, electivos]) => {
          console.log(`   📖 Procesando ${electivos.length} electivo(s) de nivel ${nivel}...`);
          
          // Buscar semestres que ya tengan ramos de ese nivel o cercano
          const semestresCandidatos = semestres
            .filter(s => {
              const nivelesEnSemestre = s.ramos.map(r => r.nivel);
              const nivelPromedio = nivelesEnSemestre.reduce((a, b) => a + b, 0) / nivelesEnSemestre.length;
              // Buscar semestres con nivel similar (±1)
              return Math.abs(nivelPromedio - nivel) <= 1;
            })
            .sort((a, b) => {
              // Priorizar semestres con más espacio disponible
              const espacioA = maxCreditosPorSemestre - a.totalCreditos;
              const espacioB = maxCreditosPorSemestre - b.totalCreditos;
              return espacioB - espacioA;
            });
          
          // Intentar insertar cada electivo
          for (const electivo of electivos) {
            let insertado = false;
            
            // Intentar en semestres candidatos
            for (const semestre of semestresCandidatos) {
              if (semestre.totalCreditos + electivo.creditos <= maxCreditosPorSemestre) {
                semestre.ramos.push({
                  codigo: electivo.codigo,
                  asignatura: electivo.asignatura,
                  creditos: electivo.creditos,
                  nivel: electivo.nivel,
                  razon: '📚 Electivo - Formación profesional',
                });
                semestre.totalCreditos += electivo.creditos;
                asignados.add(electivo.codigo);
                insertado = true;
                console.log(`      ✓ ${electivo.codigo} insertado en Semestre ${semestre.numero}`);
                break;
              }
            }
            
            // Si no se pudo insertar, crear semestre nuevo o agregarlo al último
            if (!insertado) {
              if (semestres.length > 0) {
                const ultimoSemestre = semestres[semestres.length - 1];
                if (ultimoSemestre.totalCreditos + electivo.creditos <= maxCreditosPorSemestre) {
                  ultimoSemestre.ramos.push({
                    codigo: electivo.codigo,
                    asignatura: electivo.asignatura,
                    creditos: electivo.creditos,
                    nivel: electivo.nivel,
                    razon: '📚 Electivo - Formación profesional',
                  });
                  ultimoSemestre.totalCreditos += electivo.creditos;
                  asignados.add(electivo.codigo);
                  insertado = true;
                  console.log(`✓ ${electivo.codigo} agregado al último semestre`);
                }
              }
            }
          }
        });
    }
    
    // FASE 2: Distribuir ramos TERMINALES (forzar llenado completo de semestres)
    console.log(`\n🏁 FASE 2: Distribuyendo ramos terminales...`);
    if (ramosTerminales.length > 0) {
      const terminalesOrdenados = ramosTerminales
        .filter(r => !asignados.has(r.codigo))
        .sort((a, b) => {
          if (a.nivel !== b.nivel) return a.nivel - b.nivel;
          return b.creditos - a.creditos;
        });
      
      let terminalesPorAgregar = [...terminalesOrdenados];
      
      // ESTRATEGIA: Llenar semestres existentes primero
      // 1. Intentar agregar terminales al último semestre crítico si tiene espacio
      if (semestres.length > 0) {
        const ultimoSemestre = semestres[semestres.length - 1];
        const espacioDisponible = maxCreditosPorSemestre - ultimoSemestre.totalCreditos;
        
        if (espacioDisponible >= 5) {
          console.log(`   💡 Llenando el último semestre crítico (${espacioDisponible} SCT disponibles)...`);
          
          // Intentar llenar TODO el espacio disponible
          let seguirAgregando = true;
          while (seguirAgregando && terminalesPorAgregar.length > 0) {
            const terminalQueCalza = terminalesPorAgregar.find(
              t => t.creditos <= (maxCreditosPorSemestre - ultimoSemestre.totalCreditos)
            );
            
            if (terminalQueCalza) {
              ultimoSemestre.ramos.push({
                codigo: terminalQueCalza.codigo,
                asignatura: terminalQueCalza.asignatura,
                creditos: terminalQueCalza.creditos,
                nivel: terminalQueCalza.nivel,
                razon: '🏁 Terminal - No desbloquea otros ramos',
              });
              ultimoSemestre.totalCreditos += terminalQueCalza.creditos;
              asignados.add(terminalQueCalza.codigo);
              terminalesPorAgregar = terminalesPorAgregar.filter(t => t.codigo !== terminalQueCalza.codigo);
              
              console.log(`      ✓ Agregado ${terminalQueCalza.codigo} (${ultimoSemestre.totalCreditos}/${maxCreditosPorSemestre} SCT)`);
            } else {
              seguirAgregando = false;
            }
          }
        }
      }
      
      // 2. Crear nuevos semestres LLENÁNDOLOS AL MÁXIMO
      while (terminalesPorAgregar.length > 0) {
        let creditosActuales = 0;
        const ramosDelSemestre: SemestreOptimizado['ramos'] = [];
        
        console.log(`   📦 Creando nuevo semestre de terminales...`);
        
        // Algoritmo GREEDY: Llenar el semestre al máximo antes de crear otro
        let seguirLlenando = true;
        while (seguirLlenando && terminalesPorAgregar.length > 0) {
          // Buscar el ramo más grande que quepa
          const ramoQueCalza = terminalesPorAgregar
            .filter(r => creditosActuales + r.creditos <= maxCreditosPorSemestre)
            .sort((a, b) => b.creditos - a.creditos)[0]; // Más grande primero
          
          if (ramoQueCalza) {
            ramosDelSemestre.push({
              codigo: ramoQueCalza.codigo,
              asignatura: ramoQueCalza.asignatura,
              creditos: ramoQueCalza.creditos,
              nivel: ramoQueCalza.nivel,
              razon: '🏁 Terminal - No desbloquea otros ramos',
            });
            creditosActuales += ramoQueCalza.creditos;
            terminalesPorAgregar = terminalesPorAgregar.filter(r => r.codigo !== ramoQueCalza.codigo);
            
            console.log(`✓ Agregado ${ramoQueCalza.codigo} (${creditosActuales}/${maxCreditosPorSemestre} SCT)`);
          } else {
            // No cabe ningún ramo más, terminar este semestre
            seguirLlenando = false;
            console.log(`⛔ Semestre lleno (${creditosActuales}/${maxCreditosPorSemestre} SCT)`);
          }
        }
        
        // Si solo quedó 1 ramo y hay semestres anteriores, combinarlo
        if (ramosDelSemestre.length === 1 && semestres.length > 0) {
          const ultimoSemestre = semestres[semestres.length - 1];
          const ramo = ramosDelSemestre[0];
          
          if (ultimoSemestre.totalCreditos + ramo.creditos <= maxCreditosPorSemestre) {
            console.log(`📌 Combinando último terminal con semestre anterior (${ramo.codigo})`);           
            ultimoSemestre.ramos.push(ramo);
            ultimoSemestre.totalCreditos += ramo.creditos;
            asignados.add(ramo.codigo);
            break;
          }
        }
        
        if (ramosDelSemestre.length === 0) break;
        
        semestres.push({
          numero: semestreNumero++,
          ramos: ramosDelSemestre,
          totalCreditos: creditosActuales,
        });
        
        ramosDelSemestre.forEach(r => asignados.add(r.codigo));
      }
    }
    
    // FASE 3: Agregar CAPSTONE (siempre en semestre propio)
    console.log(`\n🎓 FASE 3: Agregando Capstone al final...`);
    if (capstones.length > 0) {
      const capstonesPendientes = capstones.filter(r => !asignados.has(r.codigo));
      
      if (capstonesPendientes.length > 0) {
        console.log(`   📌 Creando semestre exclusivo para Capstone`);
        
        const semestreCapstone: SemestreOptimizado = {
          numero: semestreNumero++,
          ramos: capstonesPendientes.map(r => ({
            codigo: r.codigo,
            asignatura: r.asignatura,
            creditos: r.creditos,
            nivel: r.nivel,
            razon: '🎓 Proyecto Final - Capstone',
          })),
          totalCreditos: capstonesPendientes.reduce((sum, r) => sum + r.creditos, 0),
        };
        
        semestres.push(semestreCapstone);
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
    
    const semestresConUnRamo = semestres.filter(s => s.ramos.length === 1);
    if (semestresConUnRamo.length > 0) {
      console.warn(`⚠️ Advertencia: ${semestresConUnRamo.length} semestres con solo 1 ramo`);
    }
    
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
    minCreditos: number
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