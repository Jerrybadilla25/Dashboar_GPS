'use client';

import { loginUser, registerUser } from '@/lib/actions/authActions';
import Link from 'next/link';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [needsRegistration, setNeedsRegistration] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(formData) {
    setIsLoading(true);
    setError('');
    
    try {
      const result = await loginUser(formData);
      
      if (result.success) {
        window.location.href = '/dashboard';
      } else {
        if (result.needsRegistration) {
          setNeedsRegistration(true);
        }
        setError(result.error);
      }
    } catch (error) {
      setError('Error al iniciar sesión');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRegister(formData) {
    setIsLoading(true);
    setError('');
    
    try {
      // Agregar el email al formData ya que no está en los campos del formulario
      const formDataWithEmail = new FormData();
      formDataWithEmail.append('name', formData.get('name'));
      formDataWithEmail.append('email', email); // Usar el email del estado
      formDataWithEmail.append('password', formData.get('password'));
      formDataWithEmail.append('deviceId', formData.get('deviceId'));

      const result = await registerUser(formDataWithEmail);
      
      if (result.success) {
        window.location.href = '/dashboard';
      } else {
        setError(result.error);
      }
    } catch (error) {
      setError('Error al completar el registro');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {needsRegistration ? 'Completar Registro' : 'Iniciar sesión'}
          </h2>
          {needsRegistration && (
            <p className="mt-2 text-center text-sm text-gray-600">
              Usuario encontrado. Por favor completa tu registro con una contraseña.
            </p>
          )}
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form 
          action={needsRegistration ? handleRegister : handleLogin} 
          className="mt-8 space-y-6"
        >
          <div className="space-y-4">
            {/* Campo email siempre visible */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Email"
                readOnly={needsRegistration} // Hacerlo de solo lectura cuando necesita registro
              />
            </div>

            {/* Campo contraseña siempre visible */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Contraseña"
              />
            </div>
            
            {/* Campos adicionales solo para registro */}
            {needsRegistration && (
              <>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nombre completo
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre completo"
                  />
                </div>
                <div>
                  <label htmlFor="deviceId" className="block text-sm font-medium text-gray-700">
                    Device ID
                  </label>
                  <input
                    id="deviceId"
                    name="deviceId"
                    type="text"
                    required
                    className="mt-1 relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Device ID"
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading 
                ? 'Procesando...' 
                : needsRegistration 
                  ? 'Completar Registro' 
                  : 'Iniciar sesión'
              }
            </button>
          </div>

          <div className="text-center">
            {needsRegistration ? (
              <button
                type="button"
                onClick={() => {
                  setNeedsRegistration(false);
                  setError('');
                }}
                className="text-blue-600 hover:text-blue-500"
              >
                ← Volver a inicio de sesión
              </button>
            ) : (
              <Link href="/register" className="text-blue-600 hover:text-blue-500">
                ¿No tienes cuenta? Regístrate
              </Link>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}