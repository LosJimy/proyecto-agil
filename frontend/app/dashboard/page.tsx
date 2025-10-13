//app/dashboard/page.tsx
'use client';
import { useRouter } from 'next/navigation';
import { getUser, clearUser } from '@/lib/session';

export default function DashboardPage() {
  const router = useRouter();
  const user = getUser();

  if (!user) return <p>No hay sesión activa</p>;
  
  return (
    <div className="flex items-center justify-center h-full text-black-300">
      <p className="text-black">Selecciona una opción del menú lateral</p>
    </div>
  );
}
