//app/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';
import { setUser } from '@/lib/session';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      console.log('Respuesta del backend:', user);

      if (!user || !user.rut || !Array.isArray(user.carreras)) {
        throw new Error('Respuesta inválida del servidor');
      }
      setUser(user);
      router.replace('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError('Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#0F758C] to-[#154D59] p-6">
      {/* Logos */}
    <div className="flex items-center justify-center gap-16 mb-6">
      <Image src="/ucnLogo.png" alt="Logo UCN" width={80} height={80} />
      <Image src="/eicLogo.png" alt="Logo Escuela Ingeniería" width={180} height={100} />
    </div>
      {/* Título */}
      <h1 className="text-2xl md:text-3xl font-bold text-[#E5E7EB] mb-8 text-center">
        ¡Bienvenidx a tu proyección académica!
      </h1>

      {/* Formulario */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white/10 backdrop-blur-md p-8 rounded-2xl shadow-lg space-y-5"
      >

        {/* Input Correo */}
        <div>
          <label className="block text-sm font-medium text-[#E5E7EB] mb-1">
            Correo
          </label>
          <input
            type="email"
            placeholder="Ingrese su correo"
            className="w-full rounded-lg p-3 border border-[#E5E7EB] text-[#E5E7EB] placeholder-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#F29544]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* Input Contraseña */}
        <div>
          <label className="block text-sm font-medium text-[#E5E7EB] mb-1">
            Contraseña
          </label>
          <input
            type="password"
            placeholder="Ingrese su contraseña"
            className="w-full rounded-lg p-3 border border-[#E5E7EB] text-[#E5E7EB] placeholder-[#E5E7EB] focus:outline-none focus:ring-2 focus:ring-[#F29544]"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-[#E5E7EB] rounded-md shadow-xl p-2 max-w-xs w-xs text-center">
            <h2 className="text-md font-semibold text-[#d62f20]">Error</h2>
            <p className="text-md text-gray-700 mt-1">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-1 px-2 py-1 bg-[#F29544] hover:bg-[#d67520] text-[#E5E7EB] rounded-lg"
            >
        Aceptar
      </button>
    </div>
)}

        {/* Botón */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-[#F29544] hover:bg-[#d67520] text-[#E5E7EB] font-semibold py-3 rounded-lg shadow-md transition-colors disabled:opacity-50"
        >
          <span>→</span>
          {loading ? 'Entrando...' : 'Iniciar sesión'}
        </button>
      </form>
    </main>
  );
}
