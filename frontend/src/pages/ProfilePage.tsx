import React, { useEffect, useMemo, useState } from 'react';
import { isAxiosError } from 'axios';
import { getMe, linkGoogle, unlinkGoogle, type MeDto } from '../api/profileApi';
import { useUserStore } from '../store/userStore';

function apiMsg(err: unknown): string {
  if (isAxiosError(err)) {
    const d = err.response?.data as { message?: string; error?: string } | undefined;
    return d?.message ?? d?.error ?? `Ошибка ${err.response?.status ?? ''}`.trim();
  }
  return err instanceof Error ? err.message : 'Ошибка';
}

export const ProfilePage: React.FC = () => {
  const user = useUserStore((s) => s.currentUser);
  const [me, setMe] = useState<MeDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const googleClientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? '';
  const googleEnabled = googleClientId.length > 0;

  const googleBtnId = useMemo(
    () => `google-link-${Math.random().toString(16).slice(2)}`,
    []
  );

  useEffect(() => {
    void (async () => {
      setErr(null);
      try {
        const m = await getMe();
        setMe(m);
      } catch (e) {
        setErr(apiMsg(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!googleEnabled) return;
    if (!me || me.googleLinked) return;

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
          setPending(true);
          setErr(null);
          try {
            const updated = await linkGoogle(resp.credential);
            setMe(updated);
          } catch (e) {
            setErr(apiMsg(e));
          } finally {
            setPending(false);
          }
        }
      });

      const el = document.getElementById(googleBtnId);
      if (el) {
        el.innerHTML = '';
        google.accounts.id.renderButton(el, {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          width: 340
        });
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [googleBtnId, googleClientId, googleEnabled, me]);

  const doUnlink = async () => {
    setPending(true);
    setErr(null);
    try {
      const updated = await unlinkGoogle();
      setMe(updated);
    } catch (e) {
      setErr(apiMsg(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Профиль</h1>
      <p className="text-sm text-gray-500 mb-6">
        Здесь можно включить вход через Google для вашего аккаунта.
      </p>

      {loading && <p className="text-sm text-gray-500">Загрузка…</p>}
      {err && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {err}
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <div className="text-sm">
          <div className="text-xs text-gray-500">Email</div>
          <div className="font-medium text-gray-900">{me?.email ?? user?.email ?? '—'}</div>
        </div>
        <div className="text-sm">
          <div className="text-xs text-gray-500">Имя</div>
          <div className="font-medium text-gray-900">{me?.fullName ?? user?.fullName ?? '—'}</div>
        </div>
        <div className="text-sm">
          <div className="text-xs text-gray-500">Роль</div>
          <div className="font-medium text-gray-900">{me?.role ?? user?.role ?? '—'}</div>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Вход через Google</h2>

        {!googleEnabled && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-md px-3 py-2">
            Google вход отключен: не задан `VITE_GOOGLE_CLIENT_ID`.
          </p>
        )}

        {googleEnabled && me?.googleLinked && (
          <div className="space-y-3">
            <div className="text-sm text-green-700">
              Google привязан. Теперь вы можете входить через кнопку Google на странице входа.
            </div>
            <button
              type="button"
              disabled={pending}
              onClick={doUnlink}
              className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 disabled:opacity-60"
            >
              Отвязать Google
            </button>
          </div>
        )}

        {googleEnabled && me && !me.googleLinked && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Нажмите кнопку ниже и выберите Google‑аккаунт с тем же email, что у вашего профиля.
            </p>
            <div id={googleBtnId} />
            {pending && <p className="text-xs text-gray-500">Сохранение…</p>}
          </div>
        )}
      </div>
    </div>
  );
};

