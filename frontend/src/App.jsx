import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { CartProvider } from './components/CartProvider.jsx';
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
import { PlaceholderPage } from './pages/PlaceholderPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
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
                <Route path="/permis" element={<PermisPage />} />
                <Route path="/concours" element={<ConcoursPage />} />
                <Route
                  path="/compte"
                  element={
                    <PlaceholderPage
                      eyebrow="Mon espace"
                      title="Carnet de prise & historique."
                      description="Votre carnet personnel, l'historique de commandes et de permis seront accessibles ici dès la mise en service du compte."
                    />
                  }
                />
              </Routes>
            </main>
            <SiteFooter />
          </div>
        </ToastProvider>
      </CartProvider>
    </BrowserRouter>
  );
}
