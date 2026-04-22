import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider.jsx';
import { CartProvider } from './components/CartProvider.jsx';
import { OrdersProvider } from './components/OrdersProvider.jsx';
import { ProductsProvider } from './components/ProductsProvider.jsx';
import { ReferenceDataProvider } from './components/ReferenceDataProvider.jsx';
import { RequireAdmin, RequireAuth } from './components/RouteGuards.jsx';
import { ScrollToTop } from './components/ScrollToTop.jsx';
import { TopNav } from './components/TopNav.jsx';
import { SiteFooter } from './components/SiteFooter.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';
import { ThemeProvider } from './components/ThemeProvider.jsx';
import { WishlistProvider } from './components/WishlistProvider.jsx';

// HomePage est chargée eagerly car c'est la landing page (LCP).
// Toutes les autres routes passent par React.lazy pour que le bundle
// initial ne contienne que l'accueil + le shell. Vite split chaque
// lazy() en son propre chunk -> le premier chargement descend de
// 630 kB a ~150 kB, les autres pages se chargent a la demande.
import { HomePage } from './pages/HomePage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';

const AboutPage = lazy(() =>
  import('./pages/AboutPage.jsx').then((m) => ({ default: m.AboutPage })),
);
const AccountPage = lazy(() =>
  import('./pages/AccountPage.jsx').then((m) => ({ default: m.AccountPage })),
);
const AdminPage = lazy(() =>
  import('./pages/AdminPage.jsx').then((m) => ({ default: m.AdminPage })),
);
const CartPage = lazy(() =>
  import('./pages/CartPage.jsx').then((m) => ({ default: m.CartPage })),
);
const CataloguePage = lazy(() =>
  import('./pages/CataloguePage.jsx').then((m) => ({ default: m.CataloguePage })),
);
const CheckoutPage = lazy(() =>
  import('./pages/CheckoutPage.jsx').then((m) => ({ default: m.CheckoutPage })),
);
const ConcoursPage = lazy(() =>
  import('./pages/ConcoursPage.jsx').then((m) => ({ default: m.ConcoursPage })),
);
const ConfirmationPage = lazy(() =>
  import('./pages/ConfirmationPage.jsx').then((m) => ({ default: m.ConfirmationPage })),
);
const ForbiddenPage = lazy(() =>
  import('./pages/ForbiddenPage.jsx').then((m) => ({ default: m.ForbiddenPage })),
);
const ForgotPasswordPage = lazy(() =>
  import('./pages/ForgotPasswordPage.jsx').then((m) => ({ default: m.ForgotPasswordPage })),
);
const HelpPage = lazy(() =>
  import('./pages/HelpPage.jsx').then((m) => ({ default: m.HelpPage })),
);
const LeaderboardPage = lazy(() =>
  import('./pages/LeaderboardPage.jsx').then((m) => ({ default: m.LeaderboardPage })),
);
const LegalPage = lazy(() =>
  import('./pages/LegalPage.jsx').then((m) => ({ default: m.LegalPage })),
);
const LoginPage = lazy(() =>
  import('./pages/LoginPage.jsx').then((m) => ({ default: m.LoginPage })),
);
const PermisPage = lazy(() =>
  import('./pages/PermisPage.jsx').then((m) => ({ default: m.PermisPage })),
);
const ProductPage = lazy(() =>
  import('./pages/ProductPage.jsx').then((m) => ({ default: m.ProductPage })),
);
const RegisterPage = lazy(() =>
  import('./pages/RegisterPage.jsx').then((m) => ({ default: m.RegisterPage })),
);
const ResetPasswordPage = lazy(() =>
  import('./pages/ResetPasswordPage.jsx').then((m) => ({ default: m.ResetPasswordPage })),
);

/**
 * Écran de transition très léger affiché pendant le chargement
 * asynchrone d'une route. Pas d'image, pas de JS lourd — juste un
 * peu de mise en page pour éviter un flash blanc.
 */
function RouteFallback() {
  return (
    <div
      className="page"
      aria-busy="true"
      aria-live="polite"
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        className="mono soft"
        style={{ fontSize: 'var(--fs-12)' }}
      >
        Chargement…
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ThemeProvider>
        <AuthProvider>
          <ReferenceDataProvider>
            <ProductsProvider>
              <OrdersProvider>
                <WishlistProvider>
                  <CartProvider>
                    <ToastProvider>
                      <div className="app-shell">
                        <TopNav />
                        <main>
                          <Suspense fallback={<RouteFallback />}>
                            <Routes>
                              {/* ── Routes publiques ──────────────────── */}
                              <Route path="/" element={<HomePage />} />
                              <Route path="/boutique" element={<CataloguePage />} />
                              <Route path="/boutique/:id" element={<ProductPage />} />
                              <Route path="/panier" element={<CartPage />} />
                              <Route path="/permis" element={<PermisPage />} />
                              <Route path="/concours" element={<ConcoursPage />} />
                              <Route path="/challenges" element={<LeaderboardPage />} />
                              <Route path="/legal/:slug" element={<LegalPage />} />
                              <Route path="/a-propos" element={<AboutPage />} />
                              <Route path="/aide" element={<HelpPage />} />
                              <Route path="/403" element={<ForbiddenPage />} />

                              {/* ── Pages d'auth (publiques) ──────────── */}
                              <Route path="/connexion" element={<LoginPage />} />
                              <Route path="/inscription" element={<RegisterPage />} />
                              <Route path="/mot-de-passe-oublie" element={<ForgotPasswordPage />} />
                              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

                              {/* ── Routes utilisateur (auth requise) ──── */}
                              <Route
                                path="/checkout"
                                element={
                                  <RequireAuth>
                                    <CheckoutPage />
                                  </RequireAuth>
                                }
                              />
                              <Route
                                path="/confirmation/:orderId"
                                element={
                                  <RequireAuth>
                                    <ConfirmationPage />
                                  </RequireAuth>
                                }
                              />
                              <Route
                                path="/compte"
                                element={
                                  <RequireAuth>
                                    <AccountPage />
                                  </RequireAuth>
                                }
                              />

                              {/* ── Routes admin (rôle ROLE_ADMIN requis) ── */}
                              <Route
                                path="/admin"
                                element={
                                  <RequireAdmin>
                                    <AdminPage />
                                  </RequireAdmin>
                                }
                              />

                              {/* ── Alias courants pour UX forgiving ───── */}
                              <Route path="/login" element={<Navigate to="/connexion" replace />} />
                              <Route path="/register" element={<Navigate to="/inscription" replace />} />
                              <Route path="/signup" element={<Navigate to="/inscription" replace />} />
                              <Route path="/shop" element={<Navigate to="/boutique" replace />} />
                              <Route path="/cart" element={<Navigate to="/panier" replace />} />
                              <Route path="/account" element={<Navigate to="/compte" replace />} />
                              <Route path="/home" element={<Navigate to="/" replace />} />

                              {/* ── Catch-all 404 ───────────────────────── */}
                              <Route path="*" element={<NotFoundPage />} />
                            </Routes>
                          </Suspense>
                        </main>
                        <SiteFooter />
                      </div>
                    </ToastProvider>
                  </CartProvider>
                </WishlistProvider>
              </OrdersProvider>
            </ProductsProvider>
          </ReferenceDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
