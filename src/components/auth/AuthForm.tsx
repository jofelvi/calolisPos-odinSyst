// components/auth/AuthForm.tsx

'use client';

import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { signInWithEmail, signUpWithEmail } from '@/services/firebase/auth';
import { useRouter } from 'next/navigation';
import * as yup from 'yup';
import { loginSchema, registerSchema } from '@/schemas/userSchema';
import { Input } from '../shared/input/input';
import odinsys from '../../../public/odinLogin.jpeg';
import Image from 'next/image';
import { Button } from '@/components/shared/button/Button';
import { signIn } from 'next-auth/react';

// Infer types from schemas
type LoginInput = yup.InferType<typeof loginSchema>;
type RegisterInput = yup.InferType<typeof registerSchema>;

export function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const router = useRouter();

  const currentSchema = isLogin ? loginSchema : registerSchema;
  type FormValues = LoginInput | RegisterInput;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(currentSchema),
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setLoading(true);
    setFirebaseError(null);

    try {
      if (isLogin) {
        await signInWithEmail(data as LoginInput);
      } else {
        await signUpWithEmail(data as RegisterInput);
      }
      router.push('/dashboard'); // Redirige al dashboard tras éxito
    } catch (error: any) {
      // Mapea códigos de error de Firebase a mensajes amigables
      const errorCode = error.code;
      let message = 'Ocurrió un error. Inténtalo de nuevo.';
      if (
        errorCode === 'auth/user-not-found' ||
        errorCode === 'auth/wrong-password'
      ) {
        message = 'El email o la contraseña son incorrectos.';
      } else if (errorCode === 'auth/email-already-in-use') {
        message = 'Este email ya está registrado.';
      }
      setFirebaseError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Columna de la imagen (Hero/Branding) - Oculta en móviles */}
      <div className="hidden md:block md:w-1/2">
        <Image
          src={odinsys}
          alt="Auth background"
          priority
          className="object-cover"
        />
      </div>

      {/* Columna del Formulario */}
      <div className="flex w-full items-center justify-center p-6 md:w-1/2">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isLogin ? 'Bienvenido de Nuevo' : 'Crea tu Cuenta'}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {isLogin
                ? 'Ingresa tus credenciales para acceder.'
                : 'Completa el formulario para registrarte.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!isLogin && (
              <div>
                <Input
                  id="name"
                  label="Nombre"
                  type="text"
                  {...register('name')}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                {/*  {errors?.name && (
                  <p className="mt-1 text-xs text-red-600">
                    {errors.name.message}
                  </p>
                )}*/}
              </div>
            )}

            <div>
              <Input
                label={'Email'}
                id="email"
                type="email"
                {...register('email')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Input
                id="password"
                type="password"
                label="Contraseña"
                {...register('password')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {firebaseError && (
              <p className="text-sm text-red-600 bg-red-100 p-3 rounded-md">
                {firebaseError}
              </p>
            )}

            <div>
              <Button
                type="submit"
                disabled={loading}
                className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? 'Cargando...' : isLogin ? 'Ingresar' : 'Registrarse'}
              </Button>
            </div>
          </form>
          <Button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="flex w-full justify-center rounded-md border border-transparent  py-2 px-4 text-sm font-medium text-white shadow-sm  focus:outline-none focus:ring-2 bg-[#db4437] text-white hover:bg-[#c53727] focus:ring-offset-2 disabled:opacity-50"
          >
            Ingresar con Google
          </Button>
          <div className="text-center text-sm">
            <Button
              variant="ghost"
              onClick={() => {
                setIsLogin(!isLogin);
                setFirebaseError(null);
              }}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              {isLogin
                ? '¿No tienes una cuenta? Regístrate'
                : '¿Ya tienes una cuenta? Ingresa'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
