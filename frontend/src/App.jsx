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
import { HomePage } from './pages/HomePage.jsx';
import { CataloguePage } from './pages/CataloguePage.jsx';
import { ProductPage } from './pages/ProductPage.jsx';
import { CartPage } from './pages/CartPage.jsx';
import { CheckoutPage } from './pages/CheckoutPage.jsx';
import { ConfirmationPage } from './pages/ConfirmationPage.jsx';
import { ConcoursPage } from './pages/ConcoursPage.jsx';
import { ForbiddenPage } from './pages/ForbiddenPage.jsx';
import { LeaderboardPage } from './pages/LeaderboardPage.jsx';
import { LegalPage } from './pages/LegalPage.jsx';
import { NotFoundPage } from './pages/NotFoundPage.jsx';
import { PermisPage } from './pages/PermisPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { AccountPage } from './pages/AccountPage.jsx';
import { AdminPage } from './pages/AdminPage.jsx';

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
                            <Route path="/403" element={<ForbiddenPage />} />

                            {/* ── Pages d'auth (publiques, redirect si déjà connecté n'est pas imposé) ── */}
                            <Route path="/connexion" element={<LoginPage />} />
                            <Route path="/inscription" element={<RegisterPage />} />

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
