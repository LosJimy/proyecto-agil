'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { obtenerProyecciones, eliminarProyeccion, actualizarProyeccion,type ProyeccionGuardada } from '@/lib/api';
import { FileText, Trash2, Edit2, Eye, Calendar, X } from 'lucide-react';

export default function MisProyeccionesPage() {
  const router = useRouter();
  const [proyecciones, setProyecciones] = useState<ProyeccionGuardada[]>([]);
  const [proyeccionSeleccionada, setProyeccionSeleccionada] = useState<ProyeccionGuardada | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modales
  const [modalRenombrar, setModalRenombrar] = useState<{ show: boolean; proyeccion: ProyeccionGuardada | null }>({ show: false, proyeccion: null });
  const [modalEliminar, setModalEliminar] = useState<{ show: boolean; proyeccion: ProyeccionGuardada | null }>({ show: false, proyeccion: null });
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    cargarProyecciones();
  }, []);

  const cargarProyecciones = async () => {
    try {
      setLoading(true);
      const data = await obtenerProyecciones();
      setProyecciones(data);
    } catch (err) {
      console.error('Error:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleRenombrar = async () => {
    if (!modalRenombrar.proyeccion || !nuevoNombre.trim()) return;

    setProcesando(true);
    try {
      await actualizarProyeccion(modalRenombrar.proyeccion._id, {
        nombre: nuevoNombre.trim()
      });
      
      await cargarProyecciones();
      
      // Si está seleccionada, actualizar también
      if (proyeccionSeleccionada?._id === modalRenombrar.proyeccion._id) {
        setProyeccionSeleccionada({
          ...proyeccionSeleccionada,
          nombre: nuevoNombre.trim()
        });
      }
      
      setModalRenombrar({ show: false, proyeccion: null });
      setNuevoNombre('');
    } catch (err) {
      console.error('Error al renombrar:', err);
      alert('Error al renombrar la proyección');
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminar = async () => {
    if (!modalEliminar.proyeccion) return;

    setProcesando(true);
    try {
      await eliminarProyeccion(modalEliminar.proyeccion._id);
      
      // Si está seleccionada, deseleccionarla
      if (proyeccionSeleccionada?._id === modalEliminar.proyeccion._id) {
        setProyeccionSeleccionada(null);
      }
      
      await cargarProyecciones();
      setModalEliminar({ show: false, proyeccion: null });
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('Error al eliminar la proyección');
    } finally {
      setProcesando(false);
    }
  };

  const handleVerProyeccion = (proyeccion: ProyeccionGuardada) => {
    setProyeccionSeleccionada(proyeccion);
  };

  const handleEditar = () => {
    if (!proyeccionSeleccionada) return;
    router.push(`/dashboard/CrearProyeccion?edit=${proyeccionSeleccionada._id}`);
  };

  const formatearFecha = (fecha: string | Date) => {
    return new Date(fecha).toLocaleDateString('es-CL', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando proyecciones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          <h3 className="font-semibold mb-2">Error al cargar proyecciones</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-gray-300 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mis Proyecciones</h1>
            <p className="text-sm text-gray-600">
              {proyecciones.length} {proyecciones.length === 1 ? 'proyección guardada' : 'proyecciones guardadas'}
            </p>
          </div>
          
          {proyeccionSeleccionada && (
            <button
              onClick={() => setProyeccionSeleccionada(null)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              <X size={18} />
              Cerrar vista
            </button>
          )}
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex gap-4 p-6 overflow-hidden">
        {/* Panel izquierdo - Lista de proyecciones */}
        <div className={`${proyeccionSeleccionada ? 'w-80' : 'w-full max-w-4xl mx-auto'} flex-shrink-0 transition-all`}>
          {proyecciones.length === 0 ? (
            <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <FileText size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No tienes proyecciones guardadas
              </h3>
              <p className="text-gray-600 mb-6">
                Crea tu primera proyección académica para planificar tu futuro
              </p>
              <button
                onClick={() => router.push('/dashboard/CrearProyeccion')}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Crear nueva proyección
              </button>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
              {proyecciones.map((proyeccion) => (
                <div
                  key={proyeccion._id}
                  className={`bg-white rounded-lg border-2 p-4 transition-all cursor-pointer ${
                    proyeccionSeleccionada?._id === proyeccion._id
                      ? 'border-teal-500 shadow-lg'
                      : 'border-gray-200 hover:border-teal-300 hover:shadow-md'
                  }`}
                  onClick={() => handleVerProyeccion(proyeccion)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">
                        {proyeccion.nombre}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatearFecha(proyeccion.updatedAt)} {/* ← CAMBIO AQUÍ */}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVerProyeccion(proyeccion);
                      }}
                      className="text-teal-600 hover:text-teal-700 p-2"
                    >
                      <Eye size={20} />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <div className="flex gap-4">
                      <span className="text-gray-600">
                        <span className="font-semibold text-gray-900">{proyeccion.totalSemestres}</span> semestres
                      </span>
                      <span className="text-gray-600">
                        <span className="font-semibold text-gray-900">{proyeccion.totalCreditos}</span> créditos
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalRenombrar({ show: true, proyeccion });
                        setNuevoNombre(proyeccion.nombre);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <Edit2 size={16} />
                      Renombrar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setModalEliminar({ show: true, proyeccion });
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 text-red-700 rounded hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel derecho - Vista de proyección */}
        {proyeccionSeleccionada && (
          <div className="flex-1 bg-white rounded-lg border border-gray-300 overflow-hidden flex flex-col">
            {/* Header de la proyección */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {proyeccionSeleccionada.nombre}
                  </h2>
                  <p className="text-sm text-gray-600">
                    Última modificación: {formatearFecha(proyeccionSeleccionada.updatedAt)} {/* ← CAMBIO AQUÍ */}
                  </p>
                </div>
                <button
                  onClick={handleEditar}
                  className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <Edit2 size={18} />
                  Editar proyección
                </button>
              </div>
            </div>

            {/* Contenido de la proyección */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {proyeccionSeleccionada.semestres.map((semestre) => (
                  <div
                    key={semestre.numero}
                    className="bg-gray-50 rounded-lg border border-gray-300 p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-gray-900 text-lg">
                        Semestre {semestre.numero}
                      </h3>
                      <span className="text-sm text-gray-600 font-medium">
                        {semestre.totalCreditos} créditos
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {semestre.ramos.map((ramo) => (
                        <div
                          key={ramo.codigo}
                          className="bg-white border-2 border-teal-300 rounded-lg p-3"
                        >
                          <div className="text-xs font-bold text-teal-700 mb-1">
                            {ramo.codigo}
                          </div>
                          <div className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
                            {ramo.asignatura}
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Nivel {ramo.nivel}</span>
                            <span className="font-bold text-gray-700">{ramo.creditos} SCT</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer con resumen */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-around text-center">
                <div>
                  <div className="text-2xl font-bold text-teal-700">
                    {proyeccionSeleccionada.totalSemestres}
                  </div>
                  <div className="text-xs text-gray-600">Semestres totales</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-700">
                    {proyeccionSeleccionada.totalCreditos}
                  </div>
                  <div className="text-xs text-gray-600">Créditos totales</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-700">
                    {proyeccionSeleccionada.semestres.reduce((sum, s) => sum + s.ramos.length, 0)}
                  </div>
                  <div className="text-xs text-gray-600">Ramos totales</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Renombrar */}
      {modalRenombrar.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Renombrar Proyección</h2>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuevo nombre
            </label>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Ej: Mi proyección actualizada"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nuevoNombre.trim()) {
                  handleRenombrar();
                }
              }}
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setModalRenombrar({ show: false, proyeccion: null });
                  setNuevoNombre('');
                }}
                disabled={procesando}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRenombrar}
                disabled={procesando || !nuevoNombre.trim()}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                {procesando ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {modalEliminar.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Eliminar Proyección</h2>
            <p className="text-gray-700 mb-6">
              ¿Estás seguro que deseas eliminar la proyección{' '}
              <span className="font-semibold">"{modalEliminar.proyeccion?.nombre}"</span>?
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalEliminar({ show: false, proyeccion: null })}
                disabled={procesando}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEliminar}
                disabled={procesando}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {procesando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}