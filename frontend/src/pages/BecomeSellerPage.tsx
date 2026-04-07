import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { useUserStore } from '../store/userStore';
import { becomeSeller } from '../api/profileApi';
import { useAuth } from '../hooks/useAuth';

export const BecomeSellerPage: React.FC = () => {
  const user = useUserStore((s) => s.currentUser);
  const { applyAuthPayload } = useAuth();
  const navigate = useNavigate();
  const [storeName, setStoreName] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (!user) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center text-sm text-gray-500">
        Загрузка профиля…
      </div>
    );
  }

  if (user.role !== 'BUYER') {
    return <Navigate to="/seller" replace />;
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!storeName.trim()) {
      setError('Укажите название магазина');
      return;
    }
    setPending(true);
    try {
      const res = await becomeSeller({
        storeName: storeName.trim(),
        storeDescription: storeDescription.trim() || undefined
      });
      applyAuthPayload({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
        userId: res.userId,
        email: res.email,
        fullName: res.fullName,
        role: res.role
      });
      navigate('/seller');
    } catch (err) {
      if (isAxiosError(err)) {
        const d = err.response?.data as { message?: string } | undefined;
        setError(typeof d?.message === 'string' ? d.message : 'Не удалось сохранить');
      } else {
        setError('Ошибка сети');
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Стать продавцом</h1>
      <p className="text-sm text-gray-600 mb-6">
        Укажите название магазина — после этого вы сможете публиковать объявления.
      </p>
      <form onSubmit={onSubmit} className="bg-white rounded-xl border border-gray-100 p-6 space-y-4">
        {error && (
          <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Название магазина</label>
          <input
            className="w-full border rounded-md px-3 py-2 text-sm"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Описание (необязательно)</label>
          <textarea
            className="w-full border rounded-md px-3 py-2 text-sm min-h-[80px]"
            value={storeDescription}
            onChange={(e) => setStoreDescription(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? 'Сохранение…' : 'Подтвердить'}
        </button>
      </form>
    </div>
  );
};
