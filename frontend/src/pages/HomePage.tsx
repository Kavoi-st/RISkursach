import React from 'react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <section className="grid gap-10 md:grid-cols-2 items-center mb-12">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-gray-900">
            Маркетплейс с рейтингами продавцов и системой споров
          </h1>
          <p className="text-gray-600 mb-6 text-lg">
            Прозрачные отзывы, честные рейтинги и удобные инструменты для модерации споров
            между покупателями и продавцами.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/catalog"
              className="px-5 py-2.5 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors"
            >
              Перейти в каталог
            </Link>
            <Link
              to="/seller"
              className="px-5 py-2.5 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
            >
              Стать продавцом
            </Link>
          </div>
        </div>
        <div className="hidden md:block">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-white shadow p-4">
              <div className="text-sm font-medium text-gray-500 mb-1">Покупатели</div>
              <div className="text-2xl font-bold text-gray-900">Безопасные сделки</div>
              <p className="text-xs text-gray-500 mt-2">
                Просматривайте рейтинги продавцов и отзывы перед покупкой.
              </p>
            </div>
            <div className="rounded-xl bg-blue-600 text-white shadow p-4">
              <div className="text-sm font-medium mb-1">Продавцы</div>
              <div className="text-2xl font-bold">Управление репутацией</div>
              <p className="text-xs mt-2">
                Отслеживайте рейтинг, отзывы и статус заказов в одном месте.
              </p>
            </div>
            <div className="rounded-xl bg-white shadow p-4 col-span-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-gray-500">Споры</div>
                  <div className="text-lg font-semibold text-gray-900">
                    Модерация и прозрачность
                  </div>
                </div>
                <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  Поддержка модераторов
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Встроенная система споров помогает честно решать конфликтные ситуации.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <FeatureCard
          title="Каталог товаров"
          description="Фильтры, поиск и рейтинги помогают быстро найти нужный товар."
        />
        <FeatureCard
          title="Рейтинги продавцов"
          description="Гибкая система оценок с разными стратегиями расчёта рейтинга."
        />
        <FeatureCard
          title="Система споров"
          description="Модераторы помогают решать проблемы между покупателями и продавцами."
        />
      </section>
    </div>
  );
};

type FeatureCardProps = {
  title: string;
  description: string;
};

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
    <h3 className="text-base font-semibold mb-2 text-gray-900">{title}</h3>
    <p className="text-sm text-gray-600">{description}</p>
  </div>
);


