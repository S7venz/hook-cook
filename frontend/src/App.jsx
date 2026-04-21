import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider.jsx';
import { CartProvider } from './components/CartProvider.jsx';
import { OrdersProvider } from './components/OrdersProvider.jsx';
import { ProductsProvider } from './components/ProductsProvider.jsx';
import { ReferenceDataProvider } from './components/ReferenceDataProvider.jsx';
import { ScrollToTop } from './components/ScrollToTop.jsx';
import { TopNav } from './components/TopNav.jsx';
import { SiteFooter } from './components/SiteFooter.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { CataloguePage } from './pages/CataloguePage.jsx';
import { ProductPage } from './pages/ProductPage.jsx';
import { CartPage } from './pages/CartPage.jsx';
import { CheckoutPage } from './pages/CheckoutPage.jsx';
import { ConfirmationPage } from './pages/ConfirmationPage.jsx';
import { ConcoursPage } from './pages/ConcoursPage.jsx';
import { PermisPage } from './pages/PermisPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { AccountPage } from './pages/AccountPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';
import { PlaceholderPage } from './pages/PlaceholderPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ReferenceDataProvider>
          <ProductsProvider>
            <OrdersProvider>
              <CartProvider>
                <ToastProvider>
          <div className="app-shell">
            <TopNav />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/boutique" element={<CataloguePage />} />
                <Route path="/boutique/:id" element={<ProductPage />} />
                <Route path="/panier" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/confirmation/:orderId" element={<ConfirmationPage />} />
                <Route path="/connexion" element={<LoginPage />} />
                <Route path="/inscription" element={<RegisterPage />} />
                <Route path="/permis" element={<PermisPage />} />
                <Route path="/concours" element={<ConcoursPage />} />
                <Route path="/compte" element={<AccountPage />} />
                <Route path="/admin" element={<AdminPage />} />
              </Routes>
            </main>
            <SiteFooter />
          </div>
                </ToastProvider>
              </CartProvider>
            </OrdersProvider>
          </ProductsProvider>
        </ReferenceDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
