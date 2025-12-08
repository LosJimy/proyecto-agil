'use client';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface ModalNombreProps {
  isOpen: boolean;
  nombreProyeccion: string;
  guardando: boolean;
  modoEdicion?: boolean;
  onClose: () => void;
  onNombreChange: (nombre: string) => void;
  onGuardar: () => void;
}

export default function ModalNombre({
  isOpen,
  nombreProyeccion,
  guardando,
  modoEdicion = false,
  onClose,
  onNombreChange,
  onGuardar,
}: ModalNombreProps) {
  const [mostrarExito, setMostrarExito] = useState(false);

  if (!isOpen) return null;

  const handleGuardar = async () => {
    await onGuardar();
    setMostrarExito(true);
    setTimeout(() => {
      setMostrarExito(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl">
        {!mostrarExito ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {modoEdicion ? 'Actualizar' : 'Guardar'} Proyección
            </h2>
            
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la proyección
            </label>
            
            <input
              type="text"
              value={nombreProyeccion}
              onChange={(e) => onNombreChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900"
              placeholder="Ej: Proyección optimizada 2025"
              autoFocus
              disabled={guardando}
            />
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
                disabled={guardando}
              >
                Cancelar
              </button>
              
              <button
                onClick={handleGuardar}
                disabled={guardando || !nombreProyeccion.trim()}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {guardando ? 'Guardando...' : modoEdicion ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              ¡Proyección guardada!
            </h3>
            <p className="text-gray-600">
              Tu proyección se ha guardado exitosamente
            </p>
          </div>
        )}
      </div>
    </div>
  );
}