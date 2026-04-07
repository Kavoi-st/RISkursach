import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { listProducts, type ProductDto } from '../api/productsApi';

export const CatalogPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? '0');
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const data = await listProducts(page, 20);
        if (!cancelled) {
          setProducts(data.content);
          setTotalPages(data.totalPages);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            isAxiosError(e) && e.code === 'ERR_NETWORK'
              ? 'Нет связи с сервером'
              : 'Не удалось загрузить каталог'
          );
          setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Каталог</h1>
          <p className="text-sm text-gray-500">
            Объявления с ценой и локацией в Беларуси.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[240px,1fr]">
        <aside className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 h-fit text-sm text-gray-600">
          Фильтры по категориям и цене можно добавить позже; сейчас показаны все активные
          объявления.
        </aside>

        <section>
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
              Загрузка…
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center text-gray-500">
              Пока нет объявлений в каталоге.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <Link
                  key={p.id}
                  to={`/products/${p.id}`}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                >
                  <div className="h-36 bg-gray-100 overflow-hidden">
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <div className="font-medium mb-1 text-gray-900 line-clamp-2">
                      {p.name}
                    </div>
                    <div className="text-blue-600 font-semibold mb-1">
                      {Number(p.price).toLocaleString('ru-BY', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}{' '}
                      {p.currency}
                    </div>
                    {(p.city || p.district) && (
                      <div className="text-xs text-gray-500 mt-auto">
                        {[p.city, p.district].filter(Boolean).join(', ')}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
              disabled={page <= 0 || loading}
              onClick={() => setSearchParams({ page: String(page - 1) })}
            >
              Назад
            </button>
            <button
              type="button"
              className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
              disabled={page + 1 >= totalPages || loading || totalPages === 0}
              onClick={() => setSearchParams({ page: String(page + 1) })}
            >
              Вперёд
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
