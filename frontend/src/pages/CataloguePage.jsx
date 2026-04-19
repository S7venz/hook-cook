import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icon.jsx';
import { ProductCard } from '../components/ProductCard.jsx';
import { categories, species, techniques } from '../data/catalog.js';
import { useProducts } from '../lib/products.js';

const SORT_OPTIONS = [
  { value: 'pertinence', label: 'Tri : pertinence' },
  { value: 'price-asc', label: 'Prix croissant' },
  { value: 'price-desc', label: 'Prix décroissant' },
  { value: 'rating', label: 'Mieux notés' },
];

function useCatalogFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo(
    () => ({
      species: searchParams.getAll('species'),
      categories: searchParams.getAll('category'),
      techniques: searchParams.getAll('technique'),
      inStock: searchParams.get('stock') === '1',
      query: searchParams.get('q') ?? '',
    }),
    [searchParams],
  );

  const update = (mutator) => {
    const next = new URLSearchParams(searchParams);
    mutator(next);
    setSearchParams(next, { replace: true });
  };

  return {
    filters,
    toggle(kind, value) {
      update((next) => {
        const current = next.getAll(kind);
        next.delete(kind);
        if (current.includes(value)) {
          current.filter((v) => v !== value).forEach((v) => next.append(kind, v));
        } else {
          [...current, value].forEach((v) => next.append(kind, v));
        }
      });
    },
    toggleInStock() {
      update((next) => {
        if (next.get('stock') === '1') next.delete('stock');
        else next.set('stock', '1');
      });
    },
    setQuery(query) {
      update((next) => {
        if (query) next.set('q', query);
        else next.delete('q');
      });
    },
    reset() {
      setSearchParams({}, { replace: true });
    },
  };
}

function FiltersPanel({ filters, onToggle, onToggleStock }) {
  return (
    <>
      <div>
        <h3>Catégorie</h3>
        <div className="filter-group">
          {categories.map((c) => (
            <label key={c.id}>
              <input
                type="checkbox"
                checked={filters.categories.includes(c.id)}
                onChange={() => onToggle('category', c.id)}
              />
              <span>{c.name}</span>
              <span className="filter-count">{c.count}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3>Espèce ciblée</h3>
        <div className="filter-group">
          {species.map((s) => (
            <label key={s.id}>
              <input
                type="checkbox"
                checked={filters.species.includes(s.id)}
                onChange={() => onToggle('species', s.id)}
              />
              <span>{s.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3>Technique</h3>
        <div className="filter-group">
          {techniques.map((t) => (
            <label key={t.id}>
              <input
                type="checkbox"
                checked={filters.techniques.includes(t.id)}
                onChange={() => onToggle('technique', t.id)}
              />
              <span>{t.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3>Disponibilité</h3>
        <div className="filter-group">
          <label>
            <input type="checkbox" checked={filters.inStock} onChange={onToggleStock} />
            <span>En stock uniquement</span>
          </label>
        </div>
      </div>
    </>
  );
}

function filterProducts(items, filters, sort) {
  let list = [...items];
  if (filters.species.length) {
    list = list.filter((p) => p.species.some((s) => filters.species.includes(s)));
  }
  if (filters.categories.length) {
    list = list.filter((p) => filters.categories.includes(p.category));
  }
  if (filters.techniques.length) {
    list = list.filter((p) => p.technique && filters.techniques.includes(p.technique));
  }
  if (filters.inStock) {
    list = list.filter((p) => p.stock > 0);
  }
  if (filters.query) {
    const q = filters.query.trim().toLowerCase();
    if (q) {
      list = list.filter((p) => {
        const haystack = [p.name, p.brand, p.sku, p.description ?? '']
          .join(' ')
          .toLowerCase();
        return haystack.includes(q);
      });
    }
  }
  if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  if (sort === 'rating') list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return list;
}

export function CataloguePage() {
  const { filters, toggle, toggleInStock, setQuery, reset } = useCatalogFilters();
  const { products, loading } = useProducts();
  const [sort, setSort] = useState('pertinence');
  const [mobileOpen, setMobileOpen] = useState(false);

  const visible = useMemo(
    () => filterProducts(products, filters, sort),
    [products, filters, sort],
  );
  const activeCount = filters.species.length + filters.categories.length + filters.techniques.length;

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const activeChips = [
    ...filters.categories.map((id) => {
      const cat = categories.find((c) => c.id === id);
      return { id: `cat-${id}`, label: cat?.name, onRemove: () => toggle('category', id) };
    }),
    ...filters.species.map((id) => {
      const sp = species.find((s) => s.id === id);
      return { id: `sp-${id}`, label: sp?.name, onRemove: () => toggle('species', id) };
    }),
    ...filters.techniques.map((id) => {
      const t = techniques.find((x) => x.id === id);
      return { id: `tech-${id}`, label: t?.name, onRemove: () => toggle('technique', id) };
    }),
  ];

  return (
    <div className="page">
      <div className="page-container">
        <div className="catalog-layout">
          <aside className="filters-sidebar" aria-label="Filtres">
            <FiltersPanel filters={filters} onToggle={toggle} onToggleStock={toggleInStock} />
          </aside>

          <main className="catalog-main">
            <div className="catalog-header">
              <div>
                <h1>La boutique</h1>
                <div className="count">
                  {visible.length} produit{visible.length > 1 ? 's' : ''} · mise à jour
                  {' '}
                  {new Intl.DateTimeFormat('fr-FR').format(new Date())}
                </div>
              </div>
              <div
                className="catalog-controls"
                style={{ display: 'flex', gap: 'var(--sp-2)' }}
              >
                <input
                  type="search"
                  className="input"
                  placeholder="Rechercher un produit…"
                  value={filters.query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Rechercher dans le catalogue"
                  style={{ height: 40, width: 220 }}
                />
                <select
                  className="select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  style={{ height: 40 }}
                  aria-label="Trier les produits"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mobile-filter-bar">
              <Button variant="ghost" size="sm" onClick={() => setMobileOpen(true)}>
                <Icon name="filter" size={16} /> Filtrer
                {activeCount > 0 ? ` (${activeCount})` : ''}
              </Button>
            </div>

            {activeChips.length > 0 && (
              <div className="active-chips">
                {activeChips.map((chip) => (
                  <span key={chip.id} className="active-chip">
                    {chip.label}
                    <button
                      onClick={chip.onRemove}
                      aria-label={`Retirer ${chip.label}`}
                      type="button"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  className="active-chip"
                  style={{ background: 'transparent', borderStyle: 'dashed' }}
                  onClick={reset}
                  type="button"
                >
                  Réinitialiser
                </button>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: 'var(--sp-16) var(--sp-4)' }}>
                <p className="soft">Chargement du catalogue…</p>
              </div>
            ) : visible.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--sp-16) var(--sp-4)' }}>
                <div
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'var(--fs-44)',
                    letterSpacing: '-0.02em',
                    marginBottom: 'var(--sp-4)',
                  }}
                >
                  Aucune touche.
                </div>
                <p
                  style={{
                    color: 'var(--ink-soft)',
                    maxWidth: '40ch',
                    margin: '0 auto var(--sp-5)',
                  }}
                >
                  Essayez moins de filtres, ou laissez-nous vous guider vers l'espèce.
                </p>
                <Button variant="ghost" onClick={reset}>
                  Repartir des espèces
                </Button>
              </div>
            ) : (
              <div className="catalog-grid">
                {visible.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>

      {mobileOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setMobileOpen(false)} />
          <aside className="drawer" aria-label="Filtres">
            <div className="drawer-header">
              <h3>Filtrer</h3>
              <button
                className="icon-btn"
                onClick={() => setMobileOpen(false)}
                aria-label="Fermer"
                type="button"
              >
                <Icon name="close" />
              </button>
            </div>
            <div
              className="drawer-body"
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}
            >
              <FiltersPanel
                filters={filters}
                onToggle={toggle}
                onToggleStock={toggleInStock}
              />
            </div>
            <div className="drawer-footer">
              <Button
                variant="primary"
                size="lg"
                full
                onClick={() => setMobileOpen(false)}
              >
                Voir {visible.length} produit{visible.length > 1 ? 's' : ''}
              </Button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
