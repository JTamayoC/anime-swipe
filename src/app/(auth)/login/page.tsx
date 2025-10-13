import { AuthButton } from '@/app/components/auth-button';

import { login, signInWithGoogle } from './actions';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6 bg-gray-50">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back! 👋</h2>
          <p className="mt-2 text-sm text-gray-600">Log in to continue to your dashboard.</p>
        </div>

        {/* Tarjeta de Formulario */}
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-gray-100">
          <form className="space-y-4">
            {/* Campos de Entrada */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition duration-150 ease-in-out"
              />
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                formAction={login}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              >
                Log In
              </button>

              <a
                href="/register"
                className="w-full text-center py-2 px-4 rounded-md text-sm font-medium text-blue-600 bg-white border border-blue-600 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
              >
                Create an Account (Sign Up)
              </a>
            </div>
          </form>

          {/* Separador de Opciones */}
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Inicio de Sesión con Google */}
          <form action={signInWithGoogle} className="mt-6">
            <AuthButton />{' '}
            {/* Asume que AuthButton usa un estilo similar a los botones de arriba */}
          </form>
        </div>
      </div>
    </div>
  );
}
