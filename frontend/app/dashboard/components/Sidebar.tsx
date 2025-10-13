// app/dashboard/components/Sidebar.tsx
'use client';

import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { clearUser, getUser } from '@/lib/session';
import { GraduationCap, Eye, PenTool, LogOut } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const user = getUser();

  const handleLogout = () => {
    clearUser();
    router.push('/login');
  };

  // Obtener el nombre de la primera carrera como identificador
  const carreraName = user?.carreras?.[0]?.nombre || 'Estudiante';

  const menuItems = [
    {
      icon: GraduationCap,
      label: 'Avance curricular',
      href: '/dashboard/Avance',
    },
    {
      icon: Eye,
      label: 'Mis proyecciones',
      href: '/dashboard/Proyecciones',
    },
    {
      icon: PenTool,
      label: 'Crear proyección',
      href: '/dashboard/CrearProyeccion',
    },
  ];

  return (
    <div className="w-[200px] bg-[#1a5a6b] h-screen flex flex-col text-white">
      {/* Header con logos */}
      <div className="p-6 border-b border-[#145060]">
        <div className="flex items-center gap-3 mb-6">
          <Image 
            src="/ucnLogo.png" 
            alt="Logo UCN" 
            width={30} 
            height={30}
            className="object-contain"
          />
          <Image 
            src="/eicLogo.png" 
            alt="Logo Escuela Ingeniería" 
            width={90} 
            height={30}
            className="object-contain"
          />
        </div>
        
        {/* Nombre del estudiante */}
        <div className="text-center">
          <div className="text-xs uppercase tracking-wide mb-1">
            {user?.rut ? `RUT: ${user.rut}` : 'Estudiante'}
          </div>
          <div className="text-xs uppercase tracking-wide font-semibold line-clamp-2">
            {carreraName}
          </div>
        </div>
      </div>

      {/* Menú de navegación */}
      <nav className="flex-1 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={`w-full px-6 py-3 flex items-center gap-3 text-left transition-colors ${
                isActive 
                  ? 'bg-[#145060] text-white' 
                  : 'text-gray-200 hover:bg-[#145060]/50'
              }`}
            >
              <Icon size={20} />
              <span className="text-sm">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Botón cerrar sesión */}
      <div className="p-6">
        <button
          onClick={handleLogout}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded flex items-center justify-center gap-2 transition-colors"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Cerrar sesión</span>
        </button>
      </div>
    </div>
  );
}