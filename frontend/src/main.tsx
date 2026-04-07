import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CatalogPage } from './pages/CatalogPage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { SellerDashboard } from './pages/SellerDashboard';
import { AdminPanel } from './pages/AdminPanel';
import {
  AdminRoute,
  AuthRequiredRoute,
  SellerRoute
} from './components/routes/AdminRoute';
import { BecomeSellerPage } from './pages/BecomeSellerPage';
import { OrdersPage } from './pages/OrdersPage';
import { DisputePage } from './pages/DisputePage';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { AppLayout } from './components/layout/AppLayout';
import './index.css';

const App: React.FC = () => (
  <BrowserRouter>
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/products/:productId" element={<ProductPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/checkout"
          element={<CheckoutPage />}
        />
        <Route
          path="/orders"
          element={
            <AuthRequiredRoute>
              <OrdersPage />
            </AuthRequiredRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <AuthRequiredRoute>
              <ProfilePage />
            </AuthRequiredRoute>
          }
        />
        <Route
          path="/become-seller"
          element={
            <AuthRequiredRoute>
              <BecomeSellerPage />
            </AuthRequiredRoute>
          }
        />
        <Route
          path="/seller"
          element={
            <SellerRoute>
              <SellerDashboard />
            </SellerRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        <Route
          path="/disputes/:disputeId"
          element={
            <AuthRequiredRoute>
              <DisputePage />
            </AuthRequiredRoute>
          }
        />
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </AppLayout>
  </BrowserRouter>
);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

