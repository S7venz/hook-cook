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
import { ConcoursPage } from './pages/ConcoursPage.jsx';
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
                <Route
                  path="/checkout"
                  element={
                    <PlaceholderPage
                      eyebrow="Paiement sécurisé"
                      title="Le tunnel de commande arrive."
                      description="Coordonnées, livraison et paiement Stripe / PayPal — cette étape est la prochaine à être branchée."
                    />
                  }
                />
                <Route
                  path="/permis"
                  element={
                    <PlaceholderPage
                      eyebrow="Permis 2026"
                      title="Votre demande de permis arrive."
                      description="Formulaire en 4 étapes, traitement sous 2 jours ouvrés, suivi du statut en ligne. Cette section est en cours d'installation."
                    />
                  }
                />
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
