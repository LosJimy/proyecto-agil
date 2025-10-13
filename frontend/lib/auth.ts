// src/lib/auth.ts
export type LoginResponse = {
  nombre: string;
  rut: string;
  carreras: {
    codigo: string;
    nombre: string;
    catalogo: string;
  }[];
  token?: string; // opcional, si tu backend genera un JWT
};

export async function login(email: string, password: string): Promise<LoginResponse> {
  const BASE = process.env.NEXT_PUBLIC_API_BASE ?? 'http://localhost:3000';
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // si tu backend maneja cookie de sesión
  });

  if (!res.ok) {
    throw new Error('Error de autenticación');
  }

  return res.json() as Promise<LoginResponse>;
}
