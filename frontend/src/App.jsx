import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from './components/ScrollToTop.jsx';
import { TopNav } from './components/TopNav.jsx';
import { SiteFooter } from './components/SiteFooter.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { CataloguePage } from './pages/CataloguePage.jsx';
import { PlaceholderPage } from './pages/PlaceholderPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ToastProvider>
        <div className="app-shell">
          <TopNav />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/boutique" element={<CataloguePage />} />
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
              <Route
                path="/concours"
                element={
                  <PlaceholderPage
                    eyebrow="Calendrier local"
                    title="Les concours locaux, en pleine préparation."
                    description="Ouvertures, open carpe, nocturnes — la liste complète et les inscriptions seront disponibles très bientôt."
                  />
                }
              />
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
    </BrowserRouter>
  );
}
