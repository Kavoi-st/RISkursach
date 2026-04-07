import React, { useEffect, useRef } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';
import { useAuth, mapRole } from '../../hooks/useAuth';
import { getAccessToken, setAccessToken } from '../../api/apiClient';
import { getMe } from '../../api/profileApi';
import { useToastStore } from '../../store/toastStore';

type Props = {
  children: React.ReactNode;
};

const navLinkClass =
  'px-3 py-2 text-sm font-medium rounded-md hover:bg-blue-50 transition-colors';

export const AppLayout: React.FC<Props> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useUserStore((s) => s.currentUser);
  const setUser = useUserStore((s) => s.setUser);
  const { logout } = useAuth();
  const bootstrapped = useRef(false);
  const toast = useToastStore((s) => s.toast);
  const clearToast = useToastStore((s) => s.clear);

  useEffect(() => {
    if (bootstrapped.current) return;
    const token = getAccessToken();
    if (!token) return;
    bootstrapped.current = true;
    void (async () => {
      try {
        const me = await getMe();
        useAuthStore.setState({ isAuthenticated: true });
        setUser({
          id: me.id,
          email: me.email,
          fullName: me.fullName,
          role: mapRole(me.role)
        });
      } catch {
        useAuthStore.getState().clearTokens();
        setAccessToken(null);
        setUser(null);
      }
    })();
  }, [setUser]);

  const showSellerNav =
    isAuthenticated && (user?.role === 'SELLER' || user?.role === 'ADMIN');
  const showBecomeSeller =
    isAuthenticated && user?.role === 'BUYER';
  const showOrdersNav = isAuthenticated;
  const showProfileNav = isAuthenticated;
  const showAdminNav =
    isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'MODERATOR');

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold">
              M
            </span>
            <span className="font-semibold text-lg text-gray-900">
              Marketplace
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <NavLink
              to="/catalog"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`
              }
            >
              Каталог
            </NavLink>
            <NavLink
              to="/cart"
              className={({ isActive }) =>
                `${navLinkClass} ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`
              }
            >
              Корзина
            </NavLink>
            {showOrdersNav && (
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`
                }
              >
                Заказы
              </NavLink>
            )}
            {showProfileNav && (
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`
                }
              >
                Профиль
              </NavLink>
            )}
            {showBecomeSeller && (
              <NavLink
                to="/become-seller"
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`
                }
              >
                Стать продавцом
              </NavLink>
            )}
            {showSellerNav && (
              <NavLink
                to="/seller"
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`
                }
              >
                Кабинет продавца
              </NavLink>
            )}
            {showAdminNav && (
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  `${navLinkClass} ${isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`
                }
              >
                Админ
              </NavLink>
            )}
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="ml-2 px-3 py-1.5 text-xs border rounded-md text-gray-700 hover:bg-gray-50"
              >
                Выйти{user ? ` (${user.fullName})` : ''}
              </button>
            ) : (
              <NavLink
                to="/auth"
                className={({ isActive }) =>
                  `${navLinkClass} ${
                    isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700'
                  }`
                }
              >
                Войти
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      {toast && (
        <div className="fixed top-4 right-4 z-50 w-[320px]">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 flex items-start justify-between gap-3">
            <div className="text-sm text-gray-900">
              {toast.message}
              {toast.linkTo && (
                <div className="mt-2">
                  <Link
                    to={toast.linkTo}
                    className="inline-flex items-center px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    onClick={() => clearToast()}
                  >
                    В корзину
                  </Link>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => clearToast()}
              className="text-gray-400 hover:text-gray-700"
              aria-label="Закрыть"
            >
              x
            </button>
          </div>
        </div>
      )}

      <footer className="border-t bg-white mt-8">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-gray-500">
          <span>© {new Date().getFullYear()} Multivendor Marketplace</span>
        </div>
      </footer>
    </div>
  );
};

