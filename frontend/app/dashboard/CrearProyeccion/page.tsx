// app/dashboard/CrearProyeccion/page.tsx
'use client';

import { useState } from 'react';

export default function CrearProyeccionPage() {
  const [nombreProyeccion, setNombreProyeccion] = useState('');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 text-black">Crear Proyección</h1>
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
        <p className="text-black mb-6">
          Crea una nueva proyección académica para planificar tu futuro y optimizar tu tiempo de egreso.
        </p>
      </div>
    </div>
  );
}