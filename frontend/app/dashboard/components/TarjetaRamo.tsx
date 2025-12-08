'use client';
import { X, AlertTriangle } from 'lucide-react';

interface RamoData {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  razon?: string;
}

interface TarjetaRamoProps {
  ramo: RamoData;
  onEliminar?: () => void;
  tipo?: 'asignado' | 'disponible';
  esCritico?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
}

export default function TarjetaRamo({
  ramo,
  onEliminar,
  tipo = 'asignado',
  esCritico = false,
  draggable = false,
  onDragStart,
}: TarjetaRamoProps) {
  const estilosAsignado = esCritico 
    ? 'bg-red-50 border-l-4 border-red-600' 
    : 'bg-teal-50 border-l-4 border-teal-500';
  const estilosDisponible = esCritico
    ? 'bg-red-50 border-2 border-red-400 cursor-move hover:bg-red-100 hover:border-red-600'
    : 'bg-gray-50 border border-gray-200 cursor-move hover:bg-gray-100 hover:border-gray-400';

  return (
    <div
      className={`rounded p-1.5 flex flex-col justify-between relative transition-all ${
        tipo === 'asignado' ? estilosAsignado : estilosDisponible
      } ${tipo === 'asignado' && !esCritico ? 'hover:shadow-md' : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      title={esCritico ? '⚠️ Ramo crítico (3+ intentos)' : ramo.asignatura}
    >
      {/* Indicador de ramo crítico */}
      {esCritico && (
        <div className="absolute -top-1 -left-1 bg-red-600 text-white rounded-full p-0.5 z-20">
          <AlertTriangle size={10} />
        </div>
      )}

      {/* Botón eliminar (solo para ramos asignados) */}
      {onEliminar && (
        <button
          onClick={onEliminar}
          className="absolute top-1 right-1 text-red-600 hover:text-red-800 hover:bg-red-100 p-0.5 rounded z-10"
          title="Eliminar ramo"
        >
          <X size={12} />
        </button>
      )}

      {/* Código del ramo */}
      <div
        className={`text-[10px] font-bold mb-0.5 ${
          esCritico ? 'text-red-700' :
          tipo === 'asignado' ? 'text-teal-700' : 'text-gray-700'
        }`}
      >
        {ramo.codigo}
      </div>

      {/* Nombre del ramo */}
      <div
        className={`text-[11px] font-semibold leading-tight line-clamp-2 mb-1 ${
          esCritico ? 'text-red-900 pr-4' :
          tipo === 'asignado' ? 'text-gray-800 pr-4' : 'text-gray-600'
        }`}
      >
        {ramo.asignatura}
      </div>

      {/* Footer */}
      <div
        className={`flex items-center justify-between text-[10px] pt-1 border-t ${
          esCritico ? 'border-red-300' :
          tipo === 'asignado' ? 'border-teal-200' : 'border-gray-200'
        }`}
      >
        <span
          className={`font-medium ${
            esCritico ? 'text-red-700' :
            tipo === 'asignado' ? 'text-teal-700' : 'text-gray-500'
          }`}
        >
          NF: {ramo.nivel}
        </span>
        <span className="font-bold text-gray-700">{ramo.creditos} SCT</span>
      </div>

      {/* Indicador visual */}
      <div
        className={`absolute top-1 left-1 w-2 h-2 rounded-full ${
          esCritico ? 'bg-red-600' :
          tipo === 'asignado' ? 'bg-teal-500' : 'bg-gray-400'
        }`}
      ></div>
    </div>
  );
}