import React from 'react';
import { Link } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';

export const CartPage: React.FC = () => {
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const total = useCartStore((s) => s.total());

  const isEmpty = items.length === 0;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-semibold mb-4 text-gray-900">Корзина</h1>

      {isEmpty ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 p-8 text-center">
          <div className="text-gray-600 mb-3">Ваша корзина пуста.</div>
          <Link
            to="/catalog"
            className="inline-flex px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Перейти в каталог
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y">
            {items.map((item) => (
              <div
                key={item.productId}
                className="p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.name}</div>
                  <div className="text-xs text-gray-500">
                    Цена: {item.price.toFixed(2)} USD • Кол-во: {item.quantity}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-blue-600 font-semibold mb-1">
                    {(item.price * item.quantity).toFixed(2)} USD
                  </div>
                  <button
                    className="text-xs text-red-500 hover:text-red-600"
                    onClick={() => removeItem(item.productId)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-5">
            <div className="text-lg font-semibold">
              Итог:{' '}
              <span className="text-blue-600">
                {total.toFixed(2)} USD
              </span>
            </div>
            <Link
              to="/checkout"
              className="inline-flex justify-center px-5 py-2.5 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
            >
              Оформить заказ
            </Link>
          </div>
        </>
      )}
    </div>
  );
};


