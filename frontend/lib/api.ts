// lib/api.ts
const BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 
      'Content-Type': 'application/json', 
      ...(init?.headers || {}) 
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// Función auxiliar para obtener el token de autenticación
function getAuthHeaders() {
  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('token='))
    ?.split('=')[1];

  if (!token) {
    throw new Error('No se encontró token de autenticación');
  }

  return {
    'Authorization': `Bearer ${token}`,
  };
}

// ============================================
// TIPOS DE DATOS
// ============================================

export interface Ramo {
  codigo: string;
  asignatura: string;
  creditos: number;
  nivel: number;
  prereq: string;
}

export interface AvanceItem {
  nrc: string;
  period: string;
  student: string;
  course: string;
  excluded: boolean;
  inscriptionType: string;
  status: string;
  veces?: number;  
}

export interface SemestreOptimizado {
  numero: number;
  ramos: {
    codigo: string;
    asignatura: string;
    creditos: number;
    nivel: number;
    razon: string;
  }[];
  totalCreditos: number;
}

export interface ProyeccionOptima {
  semestres: SemestreOptimizado[];
  totalSemestres: number;
  totalCreditos: number;
  sePuedeEgresar: boolean;
  ramosBloqueados: string[];
}

export interface ProyeccionGuardada {
  _id: string;  
  rut: string;
  carrera: string;
  nombre: string;
  semestres: SemestreOptimizado[];
  totalSemestres: number;
  totalCreditos: number;
  createdAt: string;  
  updatedAt: string; 
}

// ============================================
// FUNCIONES DE API
// ============================================

/**
 * Obtener la malla curricular completa del estudiante
 */
export async function obtenerMalla(): Promise<Ramo[]> {
  return api<Ramo[]>('/usuario/malla', {
    headers: getAuthHeaders(),
  });
}

/**
 * Obtener el avance académico del estudiante (ramos cursados y aprobados)
 */
export async function obtenerAvance(): Promise<AvanceItem[]> {
  return api<AvanceItem[]>('/usuario/avance', {
    headers: getAuthHeaders(),
  });
}

/**
 * Obtener los ramos disponibles para cursar (prerrequisitos cumplidos)
 */
export async function obtenerRamosDisponibles(): Promise<Ramo[]> {
  return api<Ramo[]>('/usuario/malla/disponibles', {
    headers: getAuthHeaders(),
  });
}

/**
 * Obtener la malla curricular de un catálogo específico
 */
export async function obtenerMallaPorCatalogo(catalogo: string): Promise<Ramo[]> {
  return api<Ramo[]>(`/usuario/malla/catalogo/${catalogo}`, {
    headers: getAuthHeaders(),
  });
}

/**
 * Obtener la proyección óptima para egresar lo más rápido posible
 */
export async function obtenerRutaOptima(): Promise<ProyeccionOptima> {
  return api<ProyeccionOptima>('/usuario/malla/optimizar', {
    headers: getAuthHeaders(),
  });
}

/**
 * Guardar una nueva proyección
*/
export async function guardarProyeccion(proyeccion: Omit<ProyeccionGuardada, '_id' | 'rut' | 'carrera' | 'createdAt' | 'updatedAt'>): Promise<ProyeccionGuardada> {
  return api<ProyeccionGuardada>('/proyecciones', {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(proyeccion),
  });
}

/**
 * Obtener todas las proyecciones del estudiante
 */
export async function obtenerProyecciones(): Promise<ProyeccionGuardada[]> {
  return api<ProyeccionGuardada[]>('/proyecciones', {
    headers: getAuthHeaders(),
  });
}

/**
 * Obtener una proyección específica por ID
 */
export async function obtenerProyeccionPorId(_id: string): Promise<ProyeccionGuardada> {
  return api<ProyeccionGuardada>(`/proyecciones/${_id}`, {
    headers: getAuthHeaders(),
  });
}

/**
 * Actualizar una proyección existente
 */
export async function actualizarProyeccion(_id: string, proyeccion: Partial<ProyeccionGuardada>): Promise<ProyeccionGuardada> {
  return api<ProyeccionGuardada>(`/proyecciones/${_id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(proyeccion),
  });
}

/**
 * Eliminar una proyección
 */
export async function eliminarProyeccion(_id: string): Promise<{ mensaje: string }> {
  return api<{ mensaje: string }>(`/proyecciones/${_id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
}