import React, { useCallback, useEffect, useState } from 'react';
import { isAxiosError } from 'axios';
import {
  BELARUS_CITIES_DISTRICTS,
  BELARUS_CITY_NAMES
} from '../data/belarusLocations';
import {
  createProduct,
  listMyProducts,
  type ProductDto
} from '../api/productsApi';
import {
  DEFAULT_LISTINGS_CATEGORY_ID,
  listCategories,
  type CategoryDto
} from '../api/categoriesApi';

const MAX_IMAGE_BYTES = 400 * 1024;

export const SellerDashboard: React.FC = () => {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [categoryId, setCategoryId] = useState(DEFAULT_LISTINGS_CATEGORY_ID);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState(BELARUS_CITY_NAMES[0] ?? 'Минск');
  const [district, setDistrict] = useState(
    BELARUS_CITIES_DISTRICTS[BELARUS_CITY_NAMES[0] ?? 'Минск']?.[0] ?? ''
  );
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  const districtsForCity = BELARUS_CITIES_DISTRICTS[city] ?? ['Другое'];

  const refreshProducts = useCallback(async () => {
    setLoadError(null);
    try {
      const page = await listMyProducts(0, 50);
      setProducts(page.content);
    } catch (e) {
      setLoadError(
        isAxiosError(e) && e.response?.status === 401
          ? 'Сессия истекла — войдите снова'
          : 'Не удалось загрузить объявления'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshProducts();
  }, [refreshProducts]);

  useEffect(() => {
    void (async () => {
      try {
        const cats: CategoryDto[] = await listCategories();
        const ob = cats.find((c) => c.slug === 'obyavleniya');
        if (ob) setCategoryId(ob.id);
        else if (cats[0]) setCategoryId(cats[0].id);
      } catch {
        /* остаётся DEFAULT_LISTINGS_CATEGORY_ID */
      }
    })();
  }, []);

  useEffect(() => {
    const d = BELARUS_CITIES_DISTRICTS[city];
    if (d && d.length > 0 && !d.includes(district)) {
      setDistrict(d[0]);
    }
  }, [city, district]);

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImageDataUrl(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setFormError('Выберите файл изображения');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setFormError('Файл слишком большой (макс. ~400 КБ для демо)');
      return;
    }
    setFormError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setImageDataUrl(null);
    setFormError(null);
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const priceNum = Number(price.replace(',', '.'));
    if (!name.trim() || !description.trim()) {
      setFormError('Укажите заголовок и описание');
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      setFormError('Укажите корректную цену');
      return;
    }
    setSubmitting(true);
    try {
      await createProduct({
        categoryId,
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        currency: 'BYN',
        availableQuantity: 1,
        city,
        district,
        imageUrl: imageDataUrl ?? undefined
      });
      resetForm();
      setFormOpen(false);
      await refreshProducts();
    } catch (err) {
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        setFormError(
          typeof data?.message === 'string'
            ? data.message
            : err.response?.status === 400
              ? 'Проверьте поля формы'
              : 'Ошибка при создании объявления'
        );
      } else {
        setFormError('Ошибка при создании объявления');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Кабинет продавца</h1>
          <p className="text-sm text-gray-500">
            Создавайте объявления с фото, ценой и адресом в Беларуси.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setFormOpen(true);
            setFormError(null);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
        >
          Добавить объявление
        </button>
      </div>

      {loadError && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {loadError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <StatCard
          label="Активные объявления"
          value={products.filter((p) => p.active).length.toString()}
        />
        <StatCard label="Всего в списке" value={products.length.toString()} />
        <StatCard label="Валюта" value="BYN" />
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div
            className="bg-white rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-listing-title"
          >
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h2 id="new-listing-title" className="font-semibold text-gray-900">
                Новое объявление
              </h2>
              <button
                type="button"
                className="text-gray-500 hover:text-gray-800 text-sm"
                onClick={() => {
                  setFormOpen(false);
                  resetForm();
                }}
              >
                Закрыть
              </button>
            </div>
            <form onSubmit={onCreate} className="p-4 space-y-3 text-sm">
              {formError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-800">
                  {formError}
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Заголовок
                </label>
                <input
                  className="w-full border rounded-md px-3 py-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 min-h-[100px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Цена (BYN)
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="w-full border rounded-md px-3 py-2"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Город
                  </label>
                  <select
                    className="w-full border rounded-md px-2 py-2"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  >
                    {BELARUS_CITY_NAMES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Район
                  </label>
                  <select
                    className="w-full border rounded-md px-2 py-2"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  >
                    {districtsForCity.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Фото (до ~400 КБ)
                </label>
                <input type="file" accept="image/*" onChange={onImageChange} />
                {imageDataUrl && (
                  <img
                    src={imageDataUrl}
                    alt="Предпросмотр"
                    className="mt-2 max-h-40 rounded-md border object-contain"
                  />
                )}
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? 'Сохранение…' : 'Опубликовать'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between">
          <div className="font-medium text-gray-900">Мои объявления</div>
          {loading && <div className="text-xs text-gray-500">Загрузка…</div>}
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-2 font-semibold text-gray-700">Название</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-700">Локация</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-700">Цена</th>
              <th className="text-left px-4 py-2 font-semibold text-gray-700">Статус</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t last:border-b-0">
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2 text-gray-600">
                  {[p.city, p.district].filter(Boolean).join(', ') || '—'}
                </td>
                <td className="px-4 py-2">
                  {Number(p.price).toFixed(2)} {p.currency}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                      p.active
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {p.active ? 'Активен' : 'Скрыт'}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && products.length === 0 && (
              <tr>
                <td className="px-4 py-6 text-gray-500 text-center" colSpan={4}>
                  Нет объявлений. Нажмите «Добавить объявление».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

type StatCardProps = {
  label: string;
  value: string;
};

const StatCard: React.FC<StatCardProps> = ({ label, value }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
    <div className="text-xs uppercase tracking-wide text-gray-500 mb-1">{label}</div>
    <div className="text-xl font-semibold text-gray-900">{value}</div>
  </div>
);
