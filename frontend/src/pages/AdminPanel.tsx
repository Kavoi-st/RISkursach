import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  listAdminDisputes,
  resolveDispute,
  takeDisputeUnderReview,
  type DisputeDto
} from '../api/disputesApi';

export const AdminPanel: React.FC = () => {
  const [tab, setTab] = useState<'OPEN' | 'UNDER_REVIEW'>('OPEN');
  const [disputes, setDisputes] = useState<DisputeDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const page = await listAdminDisputes(tab, 0, 50);
      setDisputes(page.content);
    } catch {
      setErr('Не удалось загрузить споры');
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const takeReview = async (id: string) => {
    try {
      await takeDisputeUnderReview(id);
      await load();
    } catch {
      alert('Ошибка');
    }
  };

  const resolve = async (id: string, status: 'RESOLVED' | 'REJECTED') => {
    const comment = window.prompt('Комментарий модератора (необязательно)') ?? '';
    try {
      await resolveDispute(id, status, comment || undefined);
      await load();
    } catch {
      alert('Ошибка');
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Админ‑панель</h1>
          <p className="text-sm text-gray-500">Модерация споров (OPEN / UNDER_REVIEW).</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          type="button"
          className={`px-3 py-1.5 text-sm rounded-md ${
            tab === 'OPEN' ? 'bg-blue-600 text-white' : 'bg-white border'
          }`}
          onClick={() => setTab('OPEN')}
        >
          Открытые
        </button>
        <button
          type="button"
          className={`px-3 py-1.5 text-sm rounded-md ${
            tab === 'UNDER_REVIEW' ? 'bg-blue-600 text-white' : 'bg-white border'
          }`}
          onClick={() => setTab('UNDER_REVIEW')}
        >
          На рассмотрении
        </button>
      </div>

      {err && <p className="text-sm text-red-700 mb-4">{err}</p>}
      {loading && <p className="text-sm text-gray-500">Загрузка…</p>}

      <section className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
        {disputes.length === 0 && !loading && (
          <div className="p-6 text-gray-500 text-sm">Нет споров в этом статусе.</div>
        )}
        {disputes.map((d) => (
          <div key={d.id} className="p-4 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <div className="font-semibold text-gray-900">
                Спор{' '}
                <Link to={`/disputes/${d.id}`} className="text-blue-600 hover:underline">
                  #{d.id.slice(0, 8)}…
                </Link>
              </div>
              <div className="text-sm text-gray-600 mt-1">Заказ: {d.orderId}</div>
              <div className="text-sm text-gray-700 mt-1">{d.reason}</div>
            </div>
            <div className="flex flex-wrap gap-2 shrink-0">
              {d.status === 'OPEN' && (
                <button
                  type="button"
                  className="px-3 py-1.5 text-xs border rounded-md hover:bg-gray-50"
                  onClick={() => takeReview(d.id)}
                >
                  Взять в работу
                </button>
              )}
              {(d.status === 'OPEN' || d.status === 'UNDER_REVIEW') && (
                <>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-md hover:bg-green-700"
                    onClick={() => resolve(d.id, 'RESOLVED')}
                  >
                    Решить (RESOLVED)
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs bg-gray-700 text-white rounded-md hover:bg-gray-800"
                    onClick={() => resolve(d.id, 'REJECTED')}
                  >
                    Отклонить
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
