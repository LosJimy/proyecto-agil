// frontend/app/dashboard/Avance/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearUser } from '@/lib/session';

type Ramo = {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  prereq: string;
};

export default function AvanceCurricularPage() {
  const user = getUser();
  const [ramos, setRamos] = useState<Ramo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMalla = async () => {
      try {
        const token = document.cookie
          .split('; ')
          .find(row => row.startsWith('token='))
          ?.split('=')[1];

        const response = await fetch('http://localhost:3000/usuario/malla', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Error al cargar la malla');

        const data = await response.json();
        setRamos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchMalla();
  }, []);

  // Agrupar ramos por nivel
  const ramosPorNivel = ramos.reduce((acc, ramo) => {
    if (!acc[ramo.nivel]) acc[ramo.nivel] = [];
    acc[ramo.nivel].push(ramo);
    return acc;
  }, {} as Record<number, Ramo[]>);

  // Obtener el nivel máximo
  const nivelMaximo = Math.max(...Object.keys(ramosPorNivel).map(Number), 0);

  // Convertir número romano
  const toRoman = (num: number): string => {
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
    return romans[num - 1] || num.toString();
  };

  // Convertir nombre corto de carrera a nombre completo
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
        <div className="text-black">Cargando malla curricular...</div>
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
                {ramosPorNivel[nivel]?.map((ramo) => (
                  <div
                    key={ramo.codigo}
                    className="bg-white border-2 border-gray-300 rounded p-2 hover:shadow-md transition-shadow min-h-24 flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-xs text-gray-600 mb-1">{ramo.codigo}</div>
                      <div className="text-xs font-semibold text-gray-900 line-clamp-2">
                        {ramo.asignatura}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500">NF: -</span>
                      <span className="text-xs font-medium text-gray-700">
                        {ramo.creditos} SCT
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-6 flex gap-4 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-green-500 rounded"></div>
          <span>Ramo aprobado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 rounded"></div>
          <span>Ramo pendiente</span>
        </div>
      </div>
    </div>
  );
}