import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { getDispute, postDisputeMessage, type DisputeDetailDto } from '../api/disputesApi';
import { useUserStore } from '../store/userStore';

export const DisputePage: React.FC = () => {
  const { disputeId } = useParams<{ disputeId: string }>();
  const currentUser = useUserStore((s) => s.currentUser);
  const [data, setData] = useState<DisputeDetailDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sendErr, setSendErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!disputeId) return;
    setError(null);
    try {
      const d = await getDispute(disputeId);
      setData(d);
    } catch (e) {
      if (isAxiosError(e) && e.response?.status === 403) {
        setError('Нет доступа к этому спору');
      } else {
        setError('Не удалось загрузить спор');
      }
    } finally {
      setLoading(false);
    }
  }, [disputeId]);

  useEffect(() => {
    void load();
  }, [load]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeId || !text.trim()) return;
    setSendErr(null);
    try {
      await postDisputeMessage(disputeId, text.trim());
      setText('');
      await load();
    } catch {
      setSendErr('Не удалось отправить');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center text-gray-500">
        Загрузка…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <p className="text-red-700 mb-4">{error}</p>
        <Link to="/orders" className="text-blue-600 text-sm hover:underline">
          К заказам
        </Link>
      </div>
    );
  }

  const { dispute, messages } = data;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-2">
        <Link to="/orders" className="text-xs text-blue-600 hover:underline">
          ← Заказы
        </Link>
      </div>
      <h1 className="text-2xl font-semibold mb-1 text-gray-900">Спор #{dispute.id.slice(0, 8)}…</h1>
      <div className="text-sm text-gray-500 mb-4 flex items-center gap-2 flex-wrap">
        <span>Статус:</span>
        <span
          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
            dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {dispute.status}
        </span>
      </div>
      <div className="mb-4 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="font-semibold text-gray-900 mb-1">Причина</div>
        <div className="text-sm text-gray-700">{dispute.reason}</div>
        {dispute.description && (
          <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">{dispute.description}</p>
        )}
        {dispute.resolutionComment && (
          <p className="text-sm text-green-800 mt-2 border-t pt-2">
            Решение модератора: {dispute.resolutionComment}
          </p>
        )}
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 max-h-80 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-gray-500 text-sm">Сообщений пока нет.</div>
        )}
        {messages.map((m) => {
          const mine = currentUser?.id === m.senderId;
          return (
            <div
              key={m.id}
              className={`mb-3 flex ${mine ? 'justify-end' : 'justify-start'}`}
            >
              <div className="max-w-[75%]">
                <div className="text-[10px] text-gray-500 mb-0.5">
                  {m.senderFullName ?? m.senderId}
                </div>
                <div
                  className={`px-3 py-2 rounded-lg text-sm ${
                    mine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {m.content}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(m.createdAt).toLocaleString('ru-RU')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {(dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW') && (
        <form onSubmit={send} className="flex flex-col gap-2">
          {sendErr && <p className="text-xs text-red-600">{sendErr}</p>}
          <div className="flex gap-2">
            <input
              className="flex-1 border rounded-md px-3 py-2 text-sm"
              placeholder="Сообщение в спор…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Отправить
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
