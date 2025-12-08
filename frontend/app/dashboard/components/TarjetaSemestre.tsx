'use client';
import { Trash2 } from 'lucide-react';
import TarjetaRamo from './TarjetaRamo';

interface RamoSemestre {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  razon?: string;
}

interface Semestre {
  numero: number;
  ramos: RamoSemestre[];
  totalCreditos: number;
}

interface TarjetaSemestreProps {
  semestre: Semestre;
  ramosCriticos: Set<string>;
  isHovering: boolean;
  puedeEliminar: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onEliminarRamo: (codigoRamo: string) => void;
  onEliminarSemestre: () => void;
}

const MAX_CREDITOS = 30;

export default function TarjetaSemestre({
  semestre,
  ramosCriticos,
  isHovering,
  puedeEliminar,
  onDragOver,
  onDragLeave,
  onDrop,
  onEliminarRamo,
  onEliminarSemestre,
}: TarjetaSemestreProps) {
  const toRoman = (num: number): string => {
    const romans = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
    return romans[num - 1] || num.toString();
  };

  const creditosExcedidos = semestre.totalCreditos > MAX_CREDITOS;
  const creditosCerca = semestre.totalCreditos >= 25 && semestre.totalCreditos <= MAX_CREDITOS;

  return (
    <div
      className={`flex flex-col border-2 rounded-lg bg-white overflow-hidden transition-all ${
        isHovering ? 'border-teal-500 shadow-lg' : 
        creditosExcedidos ? 'border-red-500' : 'border-gray-300'
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Header del semestre */}
      <div className={`flex-shrink-0 text-white flex items-center justify-between px-3 py-2 ${
        creditosExcedidos ? 'bg-red-600' : 'bg-teal-700'
      }`}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm">{toRoman(semestre.numero)}</span>
          <span className={`text-xs ${
            creditosExcedidos ? 'font-bold animate-pulse' : 
            creditosCerca ? 'font-semibold' : 'opacity-90'
          }`}>
            ({semestre.totalCreditos}/{MAX_CREDITOS} SCT)
          </span>
        </div>
        {puedeEliminar && (
          <button
            onClick={onEliminarSemestre}
            className="hover:bg-red-500 p-1 rounded transition-colors"
            title="Eliminar semestre"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Advertencia de créditos excedidos */}
      {creditosExcedidos && (
        <div className="bg-red-50 border-b border-red-200 px-2 py-1.5 text-[10px] text-red-700 font-semibold text-center">
          ⚠️ Límite excedido por {semestre.totalCreditos - MAX_CREDITOS} SCT
        </div>
      )}

      {/* Contenedor de ramos */}
      <div className="flex-1 flex flex-col p-1.5 gap-1.5 min-h-[200px]">
        {semestre.ramos.length === 0 ? (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded text-gray-400 text-xs">
            Arrastra ramos aquí
          </div>
        ) : (
          semestre.ramos.map((ramo) => (
            <TarjetaRamo
              key={ramo.codigo}
              ramo={ramo}
              tipo="asignado"
              esCritico={ramosCriticos.has(ramo.codigo)}
              onEliminar={() => onEliminarRamo(ramo.codigo)}
            />
          ))
        )}
      </div>
    </div>
  );
}