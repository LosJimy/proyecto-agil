// frontend/app/dashboard/avance-curricular/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { getUser } from '@/lib/session';
import { 
  obtenerMalla, 
  obtenerMallaPorCatalogo, 
  obtenerAvance, 
  type Ramo, 
  type AvanceItem 
} from '@/lib/api';

export default function AvanceCurricularPage() {
  const user = getUser();

  // === ESTADOS PRINCIPALES ===
  const [ramos, setRamos] = useState<Ramo[]>([]);
  const [avance, setAvance] = useState<AvanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // === NUEVOS ESTADOS PARA MALLAS (fusionado) ===
  const [catalogoActual, setCatalogoActual] = useState<string>('');
  const [catalogosDisponibles, setCatalogosDisponibles] = useState<
    { codigo: string; nombre: string; catalogo: string }[]
  >([]);
  const [loadingMalla, setLoadingMalla] = useState(false);

  // === CARGA INICIAL ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mallaData, avanceData] = await Promise.all([
          obtenerMalla(),
          obtenerAvance(),
        ]);

        setRamos(mallaData);
        setAvance(avanceData);

        // Configurar catálogos disponibles
        if (user?.carreras?.length) {
          const ordenadas = [...user.carreras].sort(
            (a, b) => parseInt(b.catalogo) - parseInt(a.catalogo)
          );

          setCatalogosDisponibles(ordenadas);
          setCatalogoActual(ordenadas[0].catalogo);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // === CAMBIAR DE MALLA (fusionado) ===
  const cambiarMalla = async (catalogo: string) => {
    if (catalogo === catalogoActual) return;

    setLoadingMalla(true);
    try {
      const nueva = await obtenerMallaPorCatalogo(catalogo);
      setRamos(nueva);
      setCatalogoActual(catalogo);
    } catch (err) {
      setError('Error al cargar la malla seleccionada');
    } finally {
      setLoadingMalla(false);
    }
  };

  // === ESTADO DEL RAMO (del código original) ===
  const obtenerEstadoActual = (codigoRamo: string) => {
    const registros = avance.filter((i) => i.course === codigoRamo);

    if (registros.length === 0)
      return { aprobado: false, cursando: false, veces: 0 };

    const ordenados = registros.sort((a, b) =>
      String(b.period).localeCompare(String(a.period))
    );

    const ultimo = ordenados[0];

    return {
      aprobado: ultimo.status === 'APROBADO',
      cursando:
        ultimo.status === 'INSCRITO' || ultimo.status === 'CURSANDO',
      veces: registros.length,
    };
  };

  // === AGRUPAR POR NIVELES ===
  const ramosPorNivel = ramos.reduce((acc, r) => {
    if (!acc[r.nivel]) acc[r.nivel] = [];
    acc[r.nivel].push(r);
    return acc;
  }, {} as Record<number, Ramo[]>);

  const nivelMaximo = Math.max(...Object.keys(ramosPorNivel).map(Number), 0);

  const toRoman = (n: number) =>
    ['I','II','III','IV','V','VI','VII','VIII','IX','X'][n - 1] ?? n.toString();

  const getNombreCarrera = (c: string) =>
    ({ ITI: 'Ingeniería en Tecnologías de Información',
       ICCI: 'Ingeniería Civil en Computación e Informática',
       ICI: 'Ingeniería Civil Industrial' }[c] ?? c);

  // === ESTADÍSTICAS (del original, fusionadas) ===
  const ramosConEstado = ramos.map((r) => ({
    ...r,
    estado: obtenerEstadoActual(r.codigo),
  }));

  const ramosAprobados = ramosConEstado.filter((r) => r.estado.aprobado).length;
  const ramosCursando = ramosConEstado.filter((r) => r.estado.cursando).length;

  const creditosAprobados = ramosConEstado
    .filter((r) => r.estado.aprobado)
    .reduce((sum, r) => sum + r.creditos, 0);

  const creditosTotales = ramos.reduce((sum, r) => sum + r.creditos, 0);

  // === LOADING / ERROR ===
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

  // === UI FINAL (fusionada) ===
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      
      {/* HEADER */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-gray-300 bg-white">
        <div className="flex items-center justify-between">

          {/* IZQUIERDA: TITULO + CARRERA */}
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Avance Curricular</h1>
              {user?.carreras?.[0] && (
                <div className="text-xs text-teal-700 font-medium">
                  {getNombreCarrera(user.carreras[0].nombre)}
                </div>
              )}
            </div>

            {/* SELECTOR DE CATALOGO */}
            {catalogosDisponibles.length > 1 && (
              <div className="flex items-center gap-2 pl-4 border-l border-gray-300">
                <span className="text-xs font-semibold text-gray-600">Catálogo:</span>

                <div className="flex gap-1">
                  {catalogosDisponibles.map((c) => {
                    const activo = c.catalogo === catalogoActual;

                    return (
                      <button
                        key={c.catalogo}
                        onClick={() => cambiarMalla(c.catalogo)}
                        disabled={loadingMalla}
                        className={`
                          px-3 py-1 rounded text-xs font-semibold transition-all
                          ${activo 
                            ? 'bg-teal-600 text-white shadow-md' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                          ${loadingMalla ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        {c.catalogo}
                      </button>
                    );
                  })}
                </div>

                {loadingMalla && (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-teal-600 border-t-transparent"></div>
                )}
              </div>
            )}
          </div>

          {/* DERECHA: ESTADÍSTICAS */}
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
            <div>
              <span className="text-gray-600">Progreso: {' '} </span>
              <span className="font-bold text-teal-700">
                {creditosTotales > 0
                  ? Math.round((creditosAprobados / creditosTotales) * 100)
                  : 0}
                %
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* GRID DE MALLA */}
      <div className="flex-1 p-3 overflow-hidden">
        <div
          className="h-full grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${nivelMaximo}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: nivelMaximo }, (_, idx) => idx + 1).map(
            (nivel) => {
              const ramosNivel = ramosPorNivel[nivel] || [];

              return (
                <div
                  key={nivel}
                  className="flex flex-col border border-gray-300 rounded-lg bg-white overflow-hidden"
                >
                  <div className="bg-teal-700 text-white text-center py-2 font-bold text-sm">
                    {toRoman(nivel)}
                  </div>

                  <div
                    className="flex-1 flex flex-col p-1.5 gap-1.5"
                    style={{
                      display: 'grid',
                      gridTemplateRows: `repeat(${ramosNivel.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {ramosNivel.map((ramo) => {
                      const estado = obtenerEstadoActual(ramo.codigo);
                      const critico = estado.veces >= 3;

                      return (
                        <div
                          key={ramo.codigo}
                          className={`
                            rounded p-1.5 flex flex-col justify-between relative transition-all
                            ${
                              estado.aprobado
                                ? 'bg-white border-l-4 border-green-500'
                                : estado.cursando
                                ? 'bg-yellow-50 border-l-4 border-yellow-500'
                                : critico
                                ? 'bg-red-50 border-l-4 border-red-500'
                                : 'bg-gray-50 border-l-4 border-gray-300'
                            }
                          `}
                        >
                          {critico && (
                            <div className="absolute -top-1 -left-1 bg-red-600 text-white text-[8px] font-bold px-1 rounded">
                              {estado.veces}x
                            </div>
                          )}

                          <div
                            className={`text-[10px] font-bold ${
                              critico ? 'text-red-700' : 'text-gray-700'
                            }`}
                          >
                            {ramo.codigo}
                          </div>

                          <div
                            className={`text-[11px] font-semibold leading-tight line-clamp-2 ${
                              estado.aprobado
                                ? 'text-green-800'
                                : estado.cursando
                                ? 'text-yellow-800'
                                : critico
                                ? 'text-red-800'
                                : 'text-gray-800'
                            }`}
                          >
                            {ramo.asignatura}
                          </div>

                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-gray-200">
                            <span
                              className={`font-medium ${
                                estado.aprobado
                                  ? 'text-green-700'
                                  : estado.cursando
                                  ? 'text-yellow-700'
                                  : critico
                                  ? 'text-red-700'
                                  : 'text-gray-500'
                              }`}
                            >
                              NF: {ramo.nivel}
                            </span>

                            <span className="font-bold text-gray-700">
                              {ramo.creditos} SCT
                            </span>
                          </div>

                          <div
                            className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
                              estado.aprobado
                                ? 'bg-green-500'
                                : estado.cursando
                                ? 'bg-yellow-500'
                                : critico
                                ? 'bg-red-600'
                                : 'bg-gray-400'
                            }`}
                          ></div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </div>
    </div>
  );
}
