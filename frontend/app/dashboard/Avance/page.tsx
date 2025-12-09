// frontend/app/dashboard/avance-curricular/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { getUser } from '@/lib/session';
import { obtenerMalla, obtenerAvance, type Ramo, type AvanceItem } from '@/lib/api';

export default function AvanceCurricularPage() {
  const user = getUser();
  const [ramos, setRamos] = useState<Ramo[]>([]);
  const [avance, setAvance] = useState<AvanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mallaData, avanceData] = await Promise.all([
          obtenerMalla(),
          obtenerAvance()
        ]);

        console.log('📚 Malla cargada:', mallaData.length, 'ramos');
        console.log('📊 Avance cargado:', avanceData.length, 'registros totales');
        
        setRamos(mallaData);
        setAvance(avanceData);

      } catch (err) {
        console.error('Error:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ← FIX: Obtener el estado MÁS RECIENTE de un ramo
  const obtenerEstadoActual = (codigoRamo: string): { aprobado: boolean; cursando: boolean; veces: number } => {
    const registros = avance.filter(item => item.course === codigoRamo);
    
    if (registros.length === 0) {
      return { aprobado: false, cursando: false, veces: 0 };
    }

    // Ordenar por período (más reciente primero)
    const ordenados = registros.sort((a, b) => 
      String(b.period).localeCompare(String(a.period))
    );

    const ultimoRegistro = ordenados[0];
    
    return {
      aprobado: ultimoRegistro.status === 'APROBADO',
      cursando: ultimoRegistro.status === 'INSCRITO' || ultimoRegistro.status === 'CURSANDO',
      veces: registros.length
    };
  };

  // Agrupar ramos por nivel
  const ramosPorNivel = ramos.reduce((acc: Record<number, Ramo[]>, ramo) => {
    if (!acc[ramo.nivel]) acc[ramo.nivel] = [];
    acc[ramo.nivel].push(ramo);
    return acc;
  }, {} as Record<number, Ramo[]>);

  const nivelMaximo = Math.max(...Object.keys(ramosPorNivel).map(Number), 0);

  const toRoman = (num: number): string => {
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romans[num - 1] || num.toString();
  };

  const getNombreCarrera = (nombreCorto: string): string => {
    const carreras: Record<string, string> = {
      'ITI': 'Ingeniería en Tecnologías de Información',
      'ICCI': 'Ingeniería Civil en Computación e Informática',
      'ICI': 'Ingeniería Civil Industrial'
    };
    return carreras[nombreCorto] || nombreCorto;
  };

  // ← FIX: Calcular estadísticas CORRECTAMENTE (solo ramos únicos por estado actual)
  const ramosConEstado = ramos.map(ramo => ({
    ...ramo,
    estado: obtenerEstadoActual(ramo.codigo)
  }));

  const ramosAprobados = ramosConEstado.filter(r => r.estado.aprobado).length;
  const ramosCursando = ramosConEstado.filter(r => r.estado.cursando).length;
  
  const creditosAprobados = ramosConEstado
    .filter(r => r.estado.aprobado)
    .reduce((sum, ramo) => sum + ramo.creditos, 0);
  
  const creditosTotales = ramos.reduce((sum, ramo) => sum + ramo.creditos, 0);

  console.log('✅ Estadísticas calculadas:');
  console.log('   - Ramos aprobados:', ramosAprobados);
  console.log('   - Ramos cursando:', ramosCursando);
  console.log('   - Créditos aprobados:', creditosAprobados, '/', creditosTotales);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando avance curricular...</p>
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
      {/* Header muy compacto */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-gray-300 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Avance Curricular</h1>
            {user?.carreras?.[0] && (
              <div className="text-xs text-teal-700 font-medium">
                {getNombreCarrera(user.carreras[0].nombre)}
              </div>
            )}
          </div>

          {/* Estadísticas en línea */}
          <div className="flex gap-6 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-green-500 rounded bg-white"></div>
              <span className="text-gray-600">Aprobado ({ramosAprobados})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-yellow-400 rounded bg-yellow-50"></div>
              <span className="text-gray-600">Cursando ({ramosCursando})</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 border-2 border-gray-300 rounded bg-white"></div>
              <span className="text-gray-600">Pendiente</span>
            </div>
            <div className="ml-4">
              <span className="text-gray-600">Progreso: </span>
              <span className="font-bold text-teal-700">
                {creditosTotales > 0 ? Math.round((creditosAprobados / creditosTotales) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de malla */}
      <div className="flex-1 p-3 overflow-y-auto">
        <div 
          className="h-full grid gap-2" 
          style={{ 
            gridTemplateColumns: `repeat(${nivelMaximo}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: nivelMaximo }, (_, i) => i + 1).map((nivel) => {
            const ramosSemestre = ramosPorNivel[nivel] || [];
            
            return (
              <div 
                key={nivel} 
                className="flex flex-col border border-gray-300 rounded-lg bg-white overflow-hidden"
              >
                <div className="flex-shrink-0 bg-teal-700 text-white text-center py-2 font-bold text-sm">
                  {toRoman(nivel)}
                </div>

                <div 
                  className="flex-1 flex flex-col p-1.5 gap-1.5"
                  style={{
                    display: 'grid',
                    gridTemplateRows: `repeat(${ramosSemestre.length}, minmax(0, 1fr))`
                  }}
                >
                  {ramosSemestre.map((ramo) => {
                    const estado = obtenerEstadoActual(ramo.codigo);
                    const esCritico = estado.veces >= 3;

                    return (
                      <div
                        key={ramo.codigo}
                        className={`
                          rounded p-1.5 flex flex-col justify-between relative transition-all
                          ${estado.aprobado ? 'bg-white border-l-4 border-green-500' : 
                            estado.cursando ? 'bg-yellow-50 border-l-4 border-yellow-500' : 
                            esCritico ? 'bg-red-50 border-l-4 border-red-500' :
                            'bg-gray-50 border-l-4 border-gray-300'}
                        `}
                        title={esCritico ? `⚠️ Ramo crítico (${estado.veces} intentos)` : ramo.asignatura}
                      >
                        {esCritico && (
                          <div className="absolute -top-1 -left-1 bg-red-600 text-white text-[8px] font-bold px-1 rounded z-10">
                            {estado.veces}x
                          </div>
                        )}

                        <div className={`text-[10px] font-bold mb-0.5 ${
                          esCritico ? 'text-red-700' : 'text-gray-700'
                        }`}>
                          {ramo.codigo}
                        </div>

                        <div 
                          className={`text-[11px] font-semibold leading-tight line-clamp-2 mb-1 ${
                            estado.aprobado ? 'text-green-800' : 
                            estado.cursando ? 'text-yellow-800' : 
                            esCritico ? 'text-red-800' :
                            'text-gray-800'
                          }`}
                        >
                          {ramo.asignatura}
                        </div>

                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-gray-200">
                          <span className={`font-medium ${
                            estado.aprobado ? 'text-green-700' : 
                            estado.cursando ? 'text-yellow-700' : 
                            esCritico ? 'text-red-700' :
                            'text-gray-500'
                          }`}>
                            NF: {ramo.nivel}
                          </span>
                          <span className="font-bold text-gray-700">
                            {ramo.creditos} SCT
                          </span>
                        </div>

                        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                          estado.aprobado ? 'bg-green-500' : 
                          estado.cursando ? 'bg-yellow-500' : 
                          esCritico ? 'bg-red-600' :
                          'bg-gray-400'
                        }`}></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}