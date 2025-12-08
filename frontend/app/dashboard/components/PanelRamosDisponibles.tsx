'use client';
import TarjetaRamo from './TarjetaRamo';
import type { Ramo } from '@/lib/api';
import { AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';

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

  const [height, setHeight] = useState(180);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (!dragging) return;

    const minHeight = 120;
    const maxHeight = window.innerHeight * 0.9; // más libre

    const handleMouseMove = (e: MouseEvent) => {
      const newHeight = window.innerHeight - e.clientY;
      setHeight(Math.max(minHeight, Math.min(newHeight, maxHeight)));
    };

    const handleMouseUp = () => setDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging]);

  return (
    <div
      className="fixed bottom-0 left-[200px] right-0 bg-white border-t-2 border-gray-300 shadow-lg z-10"
      style={{ height }}
    >
      {/* Barra de arrastre */}
      <div
        onMouseDown={() => setDragging(true)}
        className="w-full h-2 bg-gray-300 hover:bg-gray-400 cursor-row-resize rounded-t-md active:bg-gray-500"
      />

      {/* Contenido */}
      <div className="h-[calc(100%-8px)] overflow-y-auto p-3">
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
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {ramos.map((ramo) => (
            <TarjetaRamo
              key={ramo.codigo}
              ramo={ramo}
              tipo="disponible"
              esCritico={ramosCriticos.has(ramo.codigo)}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("ramo", JSON.stringify(ramo));
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
    </div>
  );
}
