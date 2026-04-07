import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { getProduct, type ProductDto } from '../api/productsApi';
import {
  listReviewsForProduct,
  createReview,
  type ReviewDto
} from '../api/reviewsApi';
import { listMyOrders } from '../api/ordersApi';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { useCartStore } from '../store/cartStore';
import { useToastStore } from '../store/toastStore';

export const ProductPage: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revLoading, setRevLoading] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [orderId, setOrderId] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewOk, setReviewOk] = useState(false);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUser = useUserStore((s) => s.currentUser);
  const addToCart = useCartStore((s) => s.addItem);
  const showToast = useToastStore((s) => s.show);

  const [orderOptions, setOrderOptions] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    if (!productId) {
      setLoading(false);
      setError('Не указан товар');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const p = await getProduct(productId);
        if (!cancelled) setProduct(p);
      } catch (e) {
        if (!cancelled) {
          setError(
            isAxiosError(e) && e.response?.status === 404
              ? 'Объявление не найдено'
              : 'Не удалось загрузить объявление'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const loadReviews = async (pid: string) => {
    setRevLoading(true);
    try {
      const page = await listReviewsForProduct(pid, 0, 50);
      setReviews(page.content);
    } catch {
      setReviews([]);
    } finally {
      setRevLoading(false);
    }
  };

  useEffect(() => {
    if (!productId) return;
    void loadReviews(productId);
  }, [productId]);

  useEffect(() => {
    if (!isAuthenticated || !productId) {
      setOrderOptions([]);
      return;
    }
    void (async () => {
      try {
        const page = await listMyOrders(0, 40);
        const opts: { id: string; label: string }[] = [];
        for (const o of page.content) {
          const has = (o.lines ?? []).some((l) => l.productId === productId);
          if (has) {
            opts.push({
              id: o.id,
              label: `${o.id.slice(0, 8)}… (${o.status})`
            });
          }
        }
        setOrderOptions(opts);
      } catch {
        setOrderOptions([]);
      }
    })();
  }, [isAuthenticated, productId]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId) return;
    setReviewError(null);
    setReviewOk(false);
    try {
      await createReview({
        productId,
        orderId: orderId || undefined,
        rating,
        comment: comment.trim() || undefined
      });
      setComment('');
      setOrderId('');
      setReviewOk(true);
      await loadReviews(productId);
    } catch (err) {
      if (isAxiosError(err)) {
        const d = err.response?.data as { message?: string } | undefined;
        setReviewError(d?.message ?? 'Не удалось отправить отзыв');
      } else {
        setReviewError('Ошибка');
      }
    }
  };

  const isOwnListing =
    product &&
    currentUser &&
    product.sellerId === currentUser.id;

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center text-gray-500">
        Загрузка…
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-5xl mx-auto py-12 px-4 text-center">
        <p className="text-red-700 mb-4">{error ?? 'Ошибка'}</p>
        <Link to="/catalog" className="text-blue-600 hover:underline text-sm">
          В каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="grid gap-8 lg:grid-cols-[1.3fr,1fr]">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt=""
              className="w-full max-h-96 object-contain rounded-lg bg-gray-50"
            />
          ) : (
            <div className="h-64 md:h-80 bg-gray-100 rounded-lg mb-4 flex items-center justify-center text-gray-400 text-sm">
              Нет фото
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{product.name}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
              <span>ID: {product.id}</span>
              {(product.city || product.district) && (
                <>
                  <span>•</span>
                  <span>{[product.city, product.district].filter(Boolean).join(', ')}</span>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
            <div className="text-3xl font-semibold text-gray-900">
              {Number(product.price).toLocaleString('ru-BY', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}{' '}
              {product.currency}
            </div>
            <button
              type="button"
              onClick={() => {
                addToCart({
                  productId: product.id,
                  name: product.name,
                  price: Number(product.price),
                  quantity: 1
                });
                showToast({
                  message: 'Товар добавлен в корзину',
                  linkTo: '/cart'
                });
              }}
              className="w-full px-4 py-2.5 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors"
            >
              Добавить в корзину
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-sm text-gray-500 mb-1">Продавец</div>
            <div className="font-medium text-gray-900">
              {product.sellerFullName ?? 'Продавец'}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold mb-3 text-gray-900">Описание</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.description}</p>
        </section>

        <aside className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Отзывы</h2>
          {revLoading && <p className="text-xs text-gray-500">Загрузка отзывов…</p>}
          <ul className="space-y-3 max-h-64 overflow-y-auto">
            {reviews.map((r) => (
              <li key={r.id} className="text-sm border-b border-gray-100 pb-2 last:border-0">
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-gray-800">
                    {r.authorFullName ?? 'Покупатель'}
                  </span>
                  <span className="text-amber-600 text-xs">★ {r.rating}</span>
                </div>
                {r.comment && (
                  <p className="text-gray-600 mt-1 whitespace-pre-wrap">{r.comment}</p>
                )}
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(r.createdAt).toLocaleString('ru-RU')}
                </p>
              </li>
            ))}
            {reviews.length === 0 && !revLoading && (
              <li className="text-sm text-gray-500">Пока нет отзывов.</li>
            )}
          </ul>

          {isAuthenticated && !isOwnListing && (
            <form onSubmit={submitReview} className="pt-3 border-t border-gray-100 space-y-2">
              <p className="text-xs font-medium text-gray-700">Оставить отзыв</p>
              {reviewOk && (
                <p className="text-xs text-green-700">Спасибо, отзыв сохранён.</p>
              )}
              {reviewError && (
                <p className="text-xs text-red-700">{reviewError}</p>
              )}
              <div>
                <label className="text-xs text-gray-600">Оценка</label>
                <select
                  className="w-full border rounded-md px-2 py-1.5 text-sm mt-0.5"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
              {orderOptions.length > 0 && (
                <div>
                  <label className="text-xs text-gray-600">Заказ (необязательно)</label>
                  <select
                    className="w-full border rounded-md px-2 py-1.5 text-sm mt-0.5"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  >
                    <option value="">Без привязки к заказу</option>
                    {orderOptions.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="text-xs text-gray-600">Комментарий</label>
                <textarea
                  className="w-full border rounded-md px-2 py-1.5 text-sm mt-0.5 min-h-[72px]"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Текст отзыва"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Отправить
              </button>
            </form>
          )}
          {!isAuthenticated && (
            <p className="text-xs text-gray-500 pt-2">
              <Link to="/auth" className="text-blue-600">
                Войдите
              </Link>
              , чтобы оставить отзыв.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
};
