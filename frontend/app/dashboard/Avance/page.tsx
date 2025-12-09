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

        console.log('Malla cargada:', mallaData.length, 'ramos');
        console.log('Avance cargado:', avanceData.length, 'ramos cursados');
        
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

  // Verificar si un ramo está aprobado
  const estaAprobado = (codigoRamo: string): boolean => {
    return avance.some((item) => 
      item.course === codigoRamo && 
      item.status === 'APROBADO'
    );
  };

  // Verificar si un ramo está siendo cursado actualmente
  const estaCursando = (codigoRamo: string): boolean => {
    return avance.some((item) => 
      item.course === codigoRamo && 
      (item.status === 'INSCRITO' || item.status === 'CURSANDO')
    );
  };

  // Agrupar ramos por nivel
  const ramosPorNivel = ramos.reduce((acc: Record<number, Ramo[]>, ramo) => {
    if (!acc[ramo.nivel]) acc[ramo.nivel] = [];
    acc[ramo.nivel].push(ramo);
    return acc;
  }, {} as Record<number, Ramo[]>);

  const nivelMaximo = Math.max(...Object.keys(ramosPorNivel).map(Number), 0);
  
  // Calcular el máximo de ramos en un semestre
  const maxRamosPorSemestre = Math.max(
    ...Object.values(ramosPorNivel).map(arr => arr.length),
    0
  );

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

  // Calcular estadísticas
  const ramosAprobados = avance.filter(a => a.status === 'APROBADO').length;
  const ramosCursando = avance.filter(a => a.status === 'INSCRITO' || a.status === 'CURSANDO').length;
  const creditosAprobados = ramos
    .filter(ramo => estaAprobado(ramo.codigo))
    .reduce((sum, ramo) => sum + ramo.creditos, 0);
  const creditosTotales = ramos.reduce((sum, ramo) => sum + ramo.creditos, 0);

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
              <div className="text-xs text-gray-700 font-medium">
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
                {Math.round((creditosAprobados / creditosTotales) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de malla - se ajusta dinámicamente */}
      <div className="flex-1 p-3 overflow-hidden">
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
                {/* Header del semestre */}
                <div className="flex-shrink-0 bg-teal-800 text-white text-center py-2 font-bold text-sm">
                  {toRoman(nivel)}
                </div>

                {/* Contenedor de ramos - se distribuyen equitativamente */}
                <div 
                  className="flex-1 flex flex-col p-1.5 gap-1.5"
                  style={{
                    display: 'grid',
                    gridTemplateRows: `repeat(${ramosSemestre.length}, minmax(0, 1fr))`
                  }}
                >
                  {ramosSemestre.map((ramo) => {
                    const aprobado = estaAprobado(ramo.codigo);
                    const cursando = estaCursando(ramo.codigo);

                    return (
                      <div
                        key={ramo.codigo}
                        className={`
                          rounded p-1.5 flex flex-col justify-between relative transition-all
                          ${aprobado ? 'bg-white border-l-4 border-green-500' : 
                            cursando ? 'bg-yellow-50 border-l-4 border-yellow-500' : 
                            'bg-gray-50 border-l-4 border-gray-300'}
                        `}
                      >
                        {/* Código del ramo */}
                        <div className="text-[10px] font-bold text-gray-700 mb-0.5">
                          {ramo.codigo}
                        </div>

                        {/* Nombre del ramo - 2 líneas max */}
                        <div 
                          className={`text-[11px] font-semibold leading-tight line-clamp-2 mb-1 ${
                            aprobado ? 'text-green-800' : 
                            cursando ? 'text-yellow-800' : 
                            'text-gray-800'
                          }`}
                          title={ramo.asignatura}
                        >
                          {ramo.asignatura}
                        </div>

                        {/* Footer compacto */}
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-gray-200">
                          <span className={`font-medium ${
                            aprobado ? 'text-green-700' : 
                            cursando ? 'text-yellow-700' : 
                            'text-gray-500'
                          }`}>
                            NF: {ramo.nivel}
                          </span>
                          <span className="font-bold text-gray-700">
                            {ramo.creditos} SCT
                          </span>
                        </div>

                        {/* Indicador visual pequeño */}
                        <div className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                          aprobado ? 'bg-green-500' : 
                          cursando ? 'bg-yellow-500' : 
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