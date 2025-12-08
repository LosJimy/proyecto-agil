'use client';
import TarjetaRamo from './TarjetaRamo';
import type { Ramo } from '@/lib/api';
import { AlertTriangle } from 'lucide-react';

interface PanelRamosDisponiblesProps {
  ramos: Ramo[];
  ramosCriticos: Set<string>;
  onDragStart?: (ramo: Ramo | null) => void;
}

export default function PanelRamosDisponibles({
  ramos,
  ramosCriticos,
  onDragStart,
}: PanelRamosDisponiblesProps) {
  const ramosCriticosCount = ramos.filter(r => ramosCriticos.has(r.codigo)).length;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-300 shadow-lg p-3 max-h-48 overflow-y-auto z-10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-gray-800">
            Ramos Disponibles ({ramos.length})
          </h3>
          {ramosCriticosCount > 0 && (
            <div className="flex items-center gap-1 bg-red-50 border border-red-300 rounded px-2 py-0.5">
              <AlertTriangle size={12} className="text-red-600" />
              <span className="text-xs font-semibold text-red-700">
                {ramosCriticosCount} crítico{ramosCriticosCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-600"></div>
            <span>Crítico (3+ intentos)</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {ramos.map((ramo) => (
          <TarjetaRamo
            key={ramo.codigo}
            ramo={ramo}
            tipo="disponible"
            esCritico={ramosCriticos.has(ramo.codigo)}
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.setData('ramo', JSON.stringify(ramo));
              onDragStart?.(ramo);
            }}
          />
        ))}
      </div>
      
      {ramos.length === 0 && (
        <div className="text-center text-gray-400 text-sm py-4">
          No hay ramos disponibles
        </div>
      )}
    </div>
  );
}