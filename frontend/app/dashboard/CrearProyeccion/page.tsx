'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { obtenerMalla, obtenerAvance, obtenerRutaOptima, guardarProyeccion, type Ramo, type ProyeccionOptima, type AvanceItem } from '@/lib/api';
import ModalNombre from '../components/ModalNombre';
import HeaderProyeccion from '../components/HeaderProyeccion';
import TarjetaSemestre from '../components/TarjetaSemestre';
import PanelRamosDisponibles from '../components/PanelRamosDisponibles';
import { AlertCircle } from 'lucide-react';

const MAX_CREDITOS_SEMESTRE = 30;

export default function CrearProyeccionPage() {
  const router = useRouter();
  const [malla, setMalla] = useState<Ramo[]>([]);
  const [ramosAprobados, setRamosAprobados] = useState<Set<string>>(new Set());
  const [proyeccionOptima, setProyeccionOptima] = useState<ProyeccionOptima | null>(null);
  const [proyeccionActual, setProyeccionActual] = useState<ProyeccionOptima | null>(null);
  const [ramosDisponibles, setRamosDisponibles] = useState<Ramo[]>([]);
  const [ramosCriticos, setRamosCriticos] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  
  // Alertas
  const [alertaCreditos, setAlertaCreditos] = useState<string | null>(null);
  
  // Modal de guardar
  const [mostrarModalGuardar, setMostrarModalGuardar] = useState(false);
  const [nombreProyeccion, setNombreProyeccion] = useState('Proyección 1');
  
  // Estado para drag & drop
  const [ramoArrastrado, setRamoArrastrado] = useState<Ramo | null>(null);
  const [semestreHover, setSemestreHover] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mallaData, rutaOptima, avanceData] = await Promise.all([
          obtenerMalla(),
          obtenerRutaOptima(),
          obtenerAvance()
        ]);

        setMalla(mallaData);
        setProyeccionOptima(rutaOptima);
        setProyeccionActual(JSON.parse(JSON.stringify(rutaOptima)));

        const ramosAsignados = new Set(
          rutaOptima.semestres.flatMap(s => s.ramos.map(r => r.codigo))
        );

        const aprobados = new Set(
          avanceData.filter(a => a.status === 'APROBADO').map(a => a.course)
        );
        setRamosAprobados(aprobados);

        const conteoRamos = new Map<string, number>();
        avanceData.forEach(item => {
          const count = conteoRamos.get(item.course) || 0;
          conteoRamos.set(item.course, count + 1);
        });
        
        const criticos = new Set(
          Array.from(conteoRamos.entries())
            .filter(([_, count]) => count >= 3)
            .map(([codigo, _]) => codigo)
        );
        setRamosCriticos(criticos);

        const disponibles = mallaData.filter(
          r => !aprobados.has(r.codigo) && !ramosAsignados.has(r.codigo)
        );
        
        console.log('📊 Estadísticas:');
        console.log('- Total ramos malla:', mallaData.length);
        console.log('- Ramos aprobados:', aprobados.size);
        console.log('- Ramos asignados en proyección:', ramosAsignados.size);
        console.log('- Ramos disponibles para agregar:', disponibles.length);
        
        setRamosDisponibles(disponibles);

      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const agregarRamo = (semestreNumero: number, ramo: Ramo) => {
    if (!proyeccionActual) return;

    const semestre = proyeccionActual.semestres.find(s => s.numero === semestreNumero);
    
    if (semestre) {
      const nuevosCreditos = semestre.totalCreditos + ramo.creditos;
      if (nuevosCreditos > MAX_CREDITOS_SEMESTRE) {
        setAlertaCreditos(
          `No puedes agregar este ramo. Excederías el límite de ${MAX_CREDITOS_SEMESTRE} créditos por semestre (${nuevosCreditos} SCT)`
        );
        setTimeout(() => setAlertaCreditos(null), 4000);
        return;
      }

      if (ramo.prereq && ramo.prereq.trim() !== '') {
        const prerequisitos = ramo.prereq.split(',').map(p => p.trim()).filter(p => p);
        
        const ramosCumplidos = new Set<string>(ramosAprobados);
        
        for (let i = 1; i < semestreNumero; i++) {
          const sem = proyeccionActual.semestres.find(s => s.numero === i);
          if (sem) {
            sem.ramos.forEach(r => ramosCumplidos.add(r.codigo));
          }
        }

        const tieneAlMenosUno = prerequisitos.some(p => ramosCumplidos.has(p));
        
        if (!tieneAlMenosUno) {
          const nombresPrerreq = prerequisitos.map(codigo => {
            const ramoInfo = malla.find(r => r.codigo === codigo);
            return ramoInfo ? `${codigo} - ${ramoInfo.asignatura}` : codigo;
          }).slice(0, 3);

          const masRamos = prerequisitos.length > 3 ? ` y ${prerequisitos.length - 3} más` : '';

          setAlertaCreditos(
            `❌ No puedes agregar ${ramo.codigo} aquí. Requiere al menos uno de: ${nombresPrerreq.join(', ')}${masRamos}`
          );
          setTimeout(() => setAlertaCreditos(null), 5000);
          return;
        }
      }
    }

    const nuevaProyeccion = { ...proyeccionActual };
    const semestreActualizado = nuevaProyeccion.semestres.find(s => s.numero === semestreNumero);
    
    if (semestreActualizado) {
      semestreActualizado.ramos.push({
        codigo: ramo.codigo,
        asignatura: ramo.asignatura,
        creditos: ramo.creditos,
        nivel: ramo.nivel,
        razon: 'Agregado manualmente',
      });
      semestreActualizado.totalCreditos += ramo.creditos;
    }

    setProyeccionActual(nuevaProyeccion);
    setRamosDisponibles(ramosDisponibles.filter(r => r.codigo !== ramo.codigo));
  };

  // ← NUEVA FUNCIÓN DE VALIDACIÓN
  const validarEliminacionRamo = (semestreNumero: number, codigoRamo: string): { valido: boolean; mensaje?: string } => {
    if (!proyeccionActual) return { valido: true };

    const ramosDependientes: { codigo: string; asignatura: string; semestre: number }[] = [];

    for (let i = semestreNumero + 1; i <= proyeccionActual.semestres.length; i++) {
      const semestrePosterior = proyeccionActual.semestres.find(s => s.numero === i);
      if (semestrePosterior) {
        semestrePosterior.ramos.forEach(ramo => {
          const ramoCompleto = malla.find(r => r.codigo === ramo.codigo);
          if (ramoCompleto?.prereq) {
            const prerequisitos = ramoCompleto.prereq.split(',').map(p => p.trim());
            
            if (prerequisitos.includes(codigoRamo)) {
              const otrosPrereqCumplidos = prerequisitos.filter(p => p !== codigoRamo);
              
              const ramosCumplidosParaDependiente = new Set<string>(ramosAprobados);
              
              for (let j = 1; j < i; j++) {
                const sem = proyeccionActual.semestres.find(s => s.numero === j);
                if (sem) {
                  sem.ramos.forEach(r => {
                    if (r.codigo !== codigoRamo) {
                      ramosCumplidosParaDependiente.add(r.codigo);
                    }
                  });
                }
              }
              
              const tieneOtroPrerequisito = otrosPrereqCumplidos.some(p => 
                ramosCumplidosParaDependiente.has(p)
              );
              
              if (!tieneOtroPrerequisito) {
                ramosDependientes.push({
                  codigo: ramo.codigo,
                  asignatura: ramo.asignatura,
                  semestre: i,
                });
              }
            }
          }
        });
      }
    }

    if (ramosDependientes.length > 0) {
      const ramoEliminado = malla.find(r => r.codigo === codigoRamo);
      const nombreRamoEliminado = ramoEliminado 
        ? `${ramoEliminado.codigo} - ${ramoEliminado.asignatura}` 
        : codigoRamo;

      const ejemplos = ramosDependientes.slice(0, 3).map(r => 
        `${r.codigo} (Semestre ${r.semestre})`
      ).join(', ');
      
      const masRamos = ramosDependientes.length > 3 
        ? ` y ${ramosDependientes.length - 3} más` 
        : '';

      return {
        valido: false,
        mensaje: `⚠️ No puedes eliminar "${nombreRamoEliminado}". Los siguientes ramos lo necesitan como prerrequisito: ${ejemplos}${masRamos}`
      };
    }

    return { valido: true };
  };

  const eliminarRamo = (semestreNumero: number, codigoRamo: string) => {
    if (!proyeccionActual) return;
    const validacion = validarEliminacionRamo(semestreNumero, codigoRamo);
    
    if (!validacion.valido) {
      setAlertaCreditos(validacion.mensaje || 'No se puede eliminar este ramo');
      setTimeout(() => setAlertaCreditos(null), 6000);
      return;
    }

    const nuevaProyeccion = { ...proyeccionActual };
    const semestre = nuevaProyeccion.semestres.find(s => s.numero === semestreNumero);
    
    if (semestre) {
      const ramoEliminado = semestre.ramos.find(r => r.codigo === codigoRamo);
      semestre.ramos = semestre.ramos.filter(r => r.codigo !== codigoRamo);
      semestre.totalCreditos -= ramoEliminado?.creditos || 0;

      if (ramoEliminado) {
        const ramoCompleto = malla.find(r => r.codigo === ramoEliminado.codigo);
        if (ramoCompleto) {
          setRamosDisponibles([...ramosDisponibles, ramoCompleto]);
        }
      }
    }

    setProyeccionActual(nuevaProyeccion);
  };

  const agregarSemestre = () => {
    if (!proyeccionActual) return;

    const nuevaProyeccion = { ...proyeccionActual };
    nuevaProyeccion.semestres.push({
      numero: nuevaProyeccion.semestres.length + 1,
      ramos: [],
      totalCreditos: 0,
    });
    nuevaProyeccion.totalSemestres += 1;

    setProyeccionActual(nuevaProyeccion);
  };

  const eliminarSemestre = (semestreNumero: number) => {
    if (!proyeccionActual) return;
    if (proyeccionActual.semestres.length <= 1) return;

    const nuevaProyeccion = { ...proyeccionActual };
    const semestreEliminado = nuevaProyeccion.semestres.find(s => s.numero === semestreNumero);
    
    if (semestreEliminado) {
      semestreEliminado.ramos.forEach(ramo => {
        const ramoCompleto = malla.find(r => r.codigo === ramo.codigo);
        if (ramoCompleto) {
          setRamosDisponibles(prev => [...prev, ramoCompleto]);
        }
      });

      nuevaProyeccion.semestres = nuevaProyeccion.semestres
        .filter(s => s.numero !== semestreNumero)
        .map((s, idx) => ({ ...s, numero: idx + 1 }));
      
      nuevaProyeccion.totalSemestres -= 1;
    }

    setProyeccionActual(nuevaProyeccion);
  };

  const restaurarOptima = () => {
    if (!proyeccionOptima) return;
    
    setProyeccionActual(JSON.parse(JSON.stringify(proyeccionOptima)));
    
    const ramosEnProyeccion = new Set(
      proyeccionOptima.semestres.flatMap(s => s.ramos.map(r => r.codigo))
    );
    
    const disponibles = malla.filter(
      r => !ramosAprobados.has(r.codigo) && !ramosEnProyeccion.has(r.codigo)
    );
    
    setRamosDisponibles(disponibles);
    setAlertaCreditos(null);
    
    console.log('✅ Proyección óptima restaurada');
    console.log(`   - Ramos en proyección: ${ramosEnProyeccion.size}`);
    console.log(`   - Ramos aprobados: ${ramosAprobados.size}`);
    console.log(`   - Ramos disponibles: ${disponibles.length}`);
  };

  const handleGuardar = async () => {
    if (!proyeccionActual) return;

    const datosAGuardar = {
      nombre: nombreProyeccion,
      semestres: proyeccionActual.semestres,
      totalSemestres: proyeccionActual.totalSemestres,
      totalCreditos: proyeccionActual.totalCreditos,
    };

    setGuardando(true);
    try {
      await guardarProyeccion(datosAGuardar);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setMostrarModalGuardar(false);
      router.push('/dashboard/Proyecciones');
    } catch (err) {
      console.error('Error al guardar:', err);
      setError('Error al guardar la proyección. Por favor intenta nuevamente.');
      setMostrarModalGuardar(false);
    } finally {
      setGuardando(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Calculando proyección óptima...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <h3 className="font-semibold mb-2">Error al cargar datos</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <HeaderProyeccion
        totalSemestres={proyeccionActual?.totalSemestres || 0}
        totalCreditos={proyeccionActual?.totalCreditos || 0}
        onRestaurarOptima={restaurarOptima}
        onAgregarSemestre={agregarSemestre}
        onGuardar={() => setMostrarModalGuardar(true)}
      />

      {alertaCreditos && (
        <div className="mx-4 mt-2 bg-red-50 border-l-4 border-red-500 p-3 rounded flex items-start gap-2 animate-pulse">
          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">Alerta de validación</p>
            <p className="text-xs text-red-700 mt-0.5">{alertaCreditos}</p>
          </div>
        </div>
      )}

      <div className="flex-1 p-3 overflow-auto">
        <div 
          className="grid gap-2 h-full" 
          style={{ 
            gridTemplateColumns: `repeat(${proyeccionActual?.semestres.length || 1}, minmax(180px, 1fr))`,
          }}
        >
          {proyeccionActual?.semestres.map((semestre) => (
            <TarjetaSemestre
              key={semestre.numero}
              semestre={semestre}
              ramosCriticos={ramosCriticos}
              isHovering={semestreHover === semestre.numero}
              puedeEliminar={(proyeccionActual?.semestres.length || 0) > 1}
              onDragOver={(e) => {
                e.preventDefault();
                setSemestreHover(semestre.numero);
              }}
              onDragLeave={() => setSemestreHover(null)}
              onDrop={(e) => {
                e.preventDefault();
                setSemestreHover(null);
                const ramoData = e.dataTransfer.getData('ramo');
                if (ramoData) {
                  const ramo = JSON.parse(ramoData);
                  agregarRamo(semestre.numero, ramo);
                }
              }}
              onEliminarRamo={(codigoRamo) => eliminarRamo(semestre.numero, codigoRamo)}
              onEliminarSemestre={() => eliminarSemestre(semestre.numero)}
            />
          ))}
        </div>
      </div>

      <PanelRamosDisponibles
        ramos={ramosDisponibles}
        ramosCriticos={ramosCriticos}
        onDragStart={setRamoArrastrado}
      />

      <ModalNombre
        isOpen={mostrarModalGuardar}
        nombreProyeccion={nombreProyeccion}
        guardando={guardando}
        onClose={() => setMostrarModalGuardar(false)}
        onNombreChange={setNombreProyeccion}
        onGuardar={handleGuardar}
      />
    </div>
  );
}