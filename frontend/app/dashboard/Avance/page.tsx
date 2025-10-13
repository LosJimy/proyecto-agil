// app/dashboard/Avance/page.tsx
'use client';
import { useState } from 'react';

export default function AvanceCurricularPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4 text-black">Avance Curricular</h1>
      <p className="text-black">
        Aquí se mostrará tu malla temporal con los ramos cursados por semestre.
      </p>
    </div>
  );
}