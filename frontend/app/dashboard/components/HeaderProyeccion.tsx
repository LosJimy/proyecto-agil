'use client';
import { Save, Sparkles, Plus } from 'lucide-react';

interface HeaderProyeccionProps {
  totalSemestres: number;
  totalCreditos: number;
  onRestaurarOptima: () => void;
  onAgregarSemestre: () => void;
  onGuardar: () => void;
}

export default function HeaderProyeccion({
  totalSemestres,
  totalCreditos,
  onRestaurarOptima,
  onAgregarSemestre,
  onGuardar,
}: HeaderProyeccionProps) {
  return (
    <div className="flex-shrink-0 px-4 py-2 border-b border-gray-300 bg-white">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Crear Proyección</h1>
          <div className="text-xs text-gray-700 font-medium">
            Personaliza tu ruta académica óptima
          </div>
        </div>

        {/* Controles */}
        <div className="flex gap-3 text-xs">
          <button
            onClick={onRestaurarOptima}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            <Sparkles size={14} />
            Restaurar óptima
          </button>
          <button
            onClick={onAgregarSemestre}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            <Plus size={14} />
            Agregar semestre
          </button>
          <button
            onClick={onGuardar}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white rounded hover:bg-teal-700 transition-colors"
          >
            <Save size={14} />
            Guardar proyección
          </button>
        </div>
      </div>

      {/* Leyenda y estadísticas */}
      <div className="flex items-center justify-between mt-2 text-xs">
        <div className="flex gap-4">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-teal-500 bg-teal-50 rounded"></div>
            <span className="text-gray-600">Asignado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 border-2 border-gray-300 bg-gray-50 rounded"></div>
            <span className="text-gray-600">Disponible para agregar</span>
          </div>
        </div>
        <div className="text-gray-700">
          <span className="font-semibold">{totalSemestres}</span> semestres ·{' '}
          <span className="font-semibold">{totalCreditos}</span> créditos totales
        </div>
      </div>
    </div>
  );
}