import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { listMyOrders, patchOrderStatus, type OrderDto } from '../api/ordersApi';
import { openDispute } from '../api/disputesApi';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeDesc, setDisputeDesc] = useState('');
  const [disputeErr, setDisputeErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const page = await listMyOrders(0, 30);
      setOrders(page.content);
    } catch {
      setError('Не удалось загрузить заказы');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const markPaid = async (id: string) => {
    try {
      await patchOrderStatus(id, 'PAID');
      await load();
    } catch {
      alert('Не удалось обновить статус');
    }
  };

  const submitDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeOrderId || !disputeReason.trim()) return;
    setDisputeErr(null);
    try {
      const d = await openDispute({
        orderId: disputeOrderId,
        reason: disputeReason.trim(),
        description: disputeDesc.trim() || undefined
      });
      setDisputeOrderId(null);
      setDisputeReason('');
      setDisputeDesc('');
      navigate(`/disputes/${d.id}`);
    } catch (err) {
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        setDisputeErr(data?.message ?? 'Не удалось открыть спор');
      } else {
        setDisputeErr('Ошибка');
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold text-gray-900 mb-4">Мои заказы</h1>
      {loading && <p className="text-gray-500 text-sm">Загрузка…</p>}
      {error && (
        <p className="text-red-700 text-sm mb-4">{error}</p>
      )}

      {!loading && orders.length === 0 && (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-600">
          Заказов пока нет.{' '}
          <Link to="/catalog" className="text-blue-600 hover:underline">
            В каталог
          </Link>
        </div>
      )}

      <div className="space-y-4">
        {orders.map((o) => (
          <div
            key={o.id}
            className="bg-white rounded-xl border border-gray-100 p-4 text-sm"
          >
            <div className="flex flex-wrap justify-between gap-2 mb-2">
              <span className="font-medium text-gray-900">Заказ #{o.id.slice(0, 8)}…</span>
              <span className="text-gray-600">
                {Number(o.totalAmount).toFixed(2)} {o.currency}
              </span>
            </div>
            <div className="text-xs text-gray-500 mb-2">Статус: {o.status}</div>
            <ul className="text-xs text-gray-600 mb-3 list-disc list-inside">
              {(o.lines ?? []).map((l) => (
                <li key={l.productId}>
                  {l.productName}{' '}
                  <Link to={`/products/${l.productId}`} className="text-blue-600">
                    открыть
                  </Link>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              {o.status === 'CREATED' && (
                <button
                  type="button"
                  onClick={() => markPaid(o.id)}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-medium hover:bg-green-700"
                >
                  Отметить оплаченным (демо)
                </button>
              )}
              {o.status !== 'CREATED' && (
                <button
                  type="button"
                  onClick={() => {
                    setDisputeOrderId(o.id);
                    setDisputeErr(null);
                  }}
                  className="px-3 py-1.5 border border-amber-300 text-amber-900 rounded-md text-xs hover:bg-amber-50"
                >
                  Открыть спор
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {disputeOrderId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-5 border border-gray-100">
            <h2 className="font-semibold text-gray-900 mb-3">Новый спор</h2>
            {disputeErr && (
              <p className="text-sm text-red-700 mb-2">{disputeErr}</p>
            )}
            <form onSubmit={submitDispute} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Причина</label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 min-h-[80px]"
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  className="px-3 py-2 text-xs border rounded-md"
                  onClick={() => setDisputeOrderId(null)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 text-xs bg-blue-600 text-white rounded-md"
                >
                  Отправить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
