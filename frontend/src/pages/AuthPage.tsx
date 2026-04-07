import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { isAxiosError } from 'axios';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов')
});

type LoginFormValues = z.infer<typeof loginSchema>;

const registerSchema = loginSchema.extend({
  fullName: z.string().min(2, 'Введите имя')
});

type RegisterFormValues = z.infer<typeof registerSchema>;

function apiErrorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const data = err.response?.data as { message?: string; error?: string } | string | undefined;
    if (typeof data === 'string' && data) return data;
    if (data && typeof data === 'object') {
      if (typeof data.message === 'string') return data.message;
      if (typeof data.error === 'string') return data.error;
    }
    if (err.response?.status === 401) return 'Неверный email или пароль';
    if (err.response?.status === 400) return 'Проверьте введённые данные';
    if (err.code === 'ERR_NETWORK') return 'Нет связи с сервером. Запущен ли backend?';
  }
  if (err instanceof Error) return err.message;
  return 'Не удалось выполнить запрос';
}

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { login, register, loginWithGoogleIdToken } = useAuth();
  const navigate = useNavigate();
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '';
  const googleEnabled = googleClientId.length > 0;

  const googleButtonId = useMemo(() => `google-btn-${Math.random().toString(16).slice(2)}`, []);

  useEffect(() => {
    if (!googleEnabled) return;

    const scriptId = 'google-gsi-client';
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.src = 'https://accounts.google.com/gsi/client';
      s.async = true;
      s.defer = true;
      document.head.appendChild(s);
    }

    const timer = window.setInterval(() => {
      const google = (window as any).google;
      if (!google?.accounts?.id) return;
      window.clearInterval(timer);

      google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (resp: { credential?: string }) => {
          if (!resp.credential) return;
          setSubmitError(null);
          setPending(true);
          try {
            await loginWithGoogleIdToken(resp.credential);
            navigate('/');
          } catch (e) {
            setSubmitError(apiErrorMessage(e));
          } finally {
            setPending(false);
          }
        }
      });

      const el = document.getElementById(googleButtonId);
      if (el) {
        el.innerHTML = '';
        google.accounts.id.renderButton(el, {
          theme: 'outline',
          size: 'large',
          width: 340,
          text: 'signin_with'
        });
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [googleButtonId, googleClientId, googleEnabled, loginWithGoogleIdToken, navigate]);

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' }
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', fullName: '' }
  });

  const onSubmitLogin = async (values: LoginFormValues) => {
    setSubmitError(null);
    setPending(true);
    try {
      await login(values.email, values.password);
      navigate('/');
    } catch (e) {
      setSubmitError(apiErrorMessage(e));
    } finally {
      setPending(false);
    }
  };

  const onSubmitRegister = async (values: RegisterFormValues) => {
    setSubmitError(null);
    setPending(true);
    try {
      await register(values.email, values.password, values.fullName);
      navigate('/');
    } catch (e) {
      setSubmitError(apiErrorMessage(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex mb-6 border-b border-gray-200">
          <button
            type="button"
            className={`flex-1 pb-2 text-sm font-medium ${
              mode === 'login'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => {
              setMode('login');
              setSubmitError(null);
            }}
          >
            Вход
          </button>
          <button
            type="button"
            className={`flex-1 pb-2 text-sm font-medium ${
              mode === 'register'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500'
            }`}
            onClick={() => {
              setMode('register');
              setSubmitError(null);
            }}
          >
            Регистрация
          </button>
        </div>

        {submitError && (
          <div
            className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            role="alert"
          >
            {submitError}
          </div>
        )}

        {mode === 'login' ? (
          <form
            onSubmit={loginForm.handleSubmit(onSubmitLogin)}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                className="w-full border rounded-md px-3 py-2 text-sm"
                {...loginForm.register('email')}
              />
              {loginForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <input
                type="password"
                autoComplete="current-password"
                className="w-full border rounded-md px-3 py-2 text-sm"
                {...loginForm.register('password')}
              />
              {loginForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? 'Вход…' : 'Войти'}
            </button>

            {googleEnabled ? (
              <div className="pt-2">
                <div className="text-center text-xs text-gray-400 mb-2">или</div>
                <div id={googleButtonId} className="flex justify-center" />
              </div>
            ) : (
              <p className="text-center text-xs text-gray-400 pt-2">
                Google вход отключен: не задан `VITE_GOOGLE_CLIENT_ID`
              </p>
            )}
          </form>
        ) : (
          <form
            onSubmit={registerForm.handleSubmit(onSubmitRegister)}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Имя
              </label>
              <input
                autoComplete="name"
                className="w-full border rounded-md px-3 py-2 text-sm"
                {...registerForm.register('fullName')}
              />
              {registerForm.formState.errors.fullName && (
                <p className="mt-1 text-xs text-red-500">
                  {registerForm.formState.errors.fullName.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                autoComplete="email"
                className="w-full border rounded-md px-3 py-2 text-sm"
                {...registerForm.register('email')}
              />
              {registerForm.formState.errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className="w-full border rounded-md px-3 py-2 text-sm"
                {...registerForm.register('password')}
              />
              {registerForm.formState.errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={pending}
              className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
            >
              {pending ? 'Регистрация…' : 'Зарегистрироваться'}
            </button>

            {googleEnabled ? (
              <div className="pt-2">
                <div className="text-center text-xs text-gray-400 mb-2">или</div>
                <div id={googleButtonId} className="flex justify-center" />
              </div>
            ) : (
              <p className="text-center text-xs text-gray-400 pt-2">
                Google вход отключен: не задан `VITE_GOOGLE_CLIENT_ID`
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
