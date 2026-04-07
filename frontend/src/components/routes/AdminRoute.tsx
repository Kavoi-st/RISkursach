import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useUserStore } from '../../store/userStore';

type Props = { children: React.ReactNode };

export const AuthRequiredRoute: React.FC<Props> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
};

export const SellerRoute: React.FC<Props> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useUserStore((s) => s.currentUser);
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  if (!isAuthenticated && !token) {
    return <Navigate to="/auth" replace />;
  }
  if ((isAuthenticated || !!token) && !user) {
    return (
      <div className="max-w-6xl mx-auto py-16 px-4 text-center text-gray-600 text-sm">
        Загрузка профиля…
      </div>
    );
  }
  if (user?.role === 'BUYER') {
    return <Navigate to="/become-seller" replace />;
  }
  if (user?.role !== 'SELLER' && user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export const AdminRoute: React.FC<Props> = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const role = useUserStore((s) => s.currentUser?.role);

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  if (role !== 'ADMIN' && role !== 'MODERATOR') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};
