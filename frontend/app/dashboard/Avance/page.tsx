// frontend/app/dashboard/avance-curricular/page.tsx

'use client';
import { useEffect, useState } from 'react';
import { getUser } from '@/lib/session';

type Ramo = {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  prereq: string;
};

type AvanceItem = {
  nrc: string;
  period: string;
  student: string;
  course: string;
  excluded: boolean;
  inscriptionType: string;
  status: string;
};

export default function AvanceCurricularPage() {
  const user = getUser();
  const [ramos, setRamos] = useState<Ramo[]>([]);
  const [avance, setAvance] = useState<AvanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        if (!token) {
          setError('No se encontró token de autenticación. Por favor, inicia sesión de nuevo.');
          setLoading(false);
          return;
        }

        console.log('Token encontrado:', token.substring(0, 20) + '...');

        // Obtener la malla
        const mallaResponse = await fetch('http://localhost:3000/usuario/malla', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Malla response status:', mallaResponse.status);
        
        if (!mallaResponse.ok) {
          throw new Error(`Error al cargar la malla: ${mallaResponse.status}`);
        }
        
        const mallaData = await mallaResponse.json();
        console.log('Malla cargada:', mallaData.length, 'ramos');
        setRamos(mallaData);

        // Obtener el avance (ramos cursados)
        const avanceResponse = await fetch('http://localhost:3000/usuario/avance', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('Avance response status:', avanceResponse.status);
        
        if (!avanceResponse.ok) {
          throw new Error(`Error al cargar el avance: ${avanceResponse.status}`);
        }
        
        const avanceData = await avanceResponse.json();
        console.log('Avance cargado:', avanceData.length, 'ramos cursados');
        console.log('Primer elemento:', avanceData[0]);
        
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
    return avance.some((item: AvanceItem) => 
      item.course === codigoRamo && 
      item.status === 'APROBADO'
    );
  };

  // Verificar si un ramo está siendo cursado actualmente
  const estaCursando = (codigoRamo: string): boolean => {
    return avance.some((item: AvanceItem) => 
      item.course === codigoRamo && 
      (item.status === 'INSCRITO' || item.status === 'CURSANDO')
    );
  };

  // Agrupar ramos por nivel
  const ramosPorNivel = ramos.reduce((acc: Record<number, Ramo[]>, ramo: Ramo) => {
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

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-black">Cargando avance curricular...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-black mb-2">AVANCE CURRICULAR</h1>
        {user?.carreras?.[0] && (
          <div className="inline-block bg-teal-600 text-white px-6 py-2 rounded">
            {getNombreCarrera(user.carreras[0].nombre)}
          </div>
        )}
      </div>

      {/* Grid de semestres */}
      <div className="w-full">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${nivelMaximo}, minmax(0, 1fr))` }}>
          {Array.from({ length: nivelMaximo }, (_, i) => i + 1).map((nivel) => (
            <div key={nivel}>
              {/* Header del semestre */}
              <div className="bg-orange-400 text-white text-center py-2 rounded-t font-semibold mb-2">
                {toRoman(nivel)}
              </div>

              {/* Ramos del semestre */}
              <div className="space-y-2">
                {ramosPorNivel[nivel]?.map((ramo) => {
                  const aprobado = estaAprobado(ramo.codigo);
                  const cursando = estaCursando(ramo.codigo);

                  return (
                    <div
                      key={ramo.codigo}
                      className={`
                        rounded p-2 hover:shadow-md transition-shadow min-h-24 flex flex-col justify-between relative
                        ${aprobado ? 'bg-white border-2 border-green-500' : 
                          cursando ? 'bg-yellow-50 border-2 border-yellow-400' : 
                          'bg-white border-2 border-gray-300'}
                      `}
                    >
                      {/* Indicador de aprobado */}
                      {aprobado && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}

                      {/* Indicador de cursando */}
                      {cursando && !aprobado && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">•</span>
                        </div>
                      )}

                      <div>
                        <div className="text-xs text-gray-600 mb-1">{ramo.codigo}</div>
                        <div className={`text-xs font-semibold line-clamp-2 ${aprobado ? 'text-green-700' : 'text-gray-900'}`}>
                          {ramo.asignatura}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {aprobado ? 'Aprobado' : cursando ? 'Cursando' : 'Pendiente'}
                        </span>
                        <span className="text-xs font-medium text-gray-700">
                          {ramo.creditos} SCT
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-6 flex gap-6 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-500 rounded bg-white"></div>
          <span>Ramo aprobado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-yellow-400 rounded bg-yellow-50"></div>
          <span>Cursando actualmente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 rounded bg-white"></div>
          <span>Pendiente</span>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded p-4">
          <div className="text-2xl font-bold text-green-700">
            {avance.filter((a: AvanceItem) => a.status === 'APROBADO').length}
          </div>
          <div className="text-sm text-green-600">Ramos aprobados</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <div className="text-2xl font-bold text-yellow-700">
            {avance.filter((a: AvanceItem) => a.status === 'INSCRITO' || a.status === 'CURSANDO').length}
          </div>
          <div className="text-sm text-yellow-600">Cursando</div>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded p-4">
          <div className="text-2xl font-bold text-gray-700">
            {ramos.length - avance.length}
          </div>
          <div className="text-sm text-gray-600">Pendientes</div>
        </div>
      </div>
    </div>
  );
}