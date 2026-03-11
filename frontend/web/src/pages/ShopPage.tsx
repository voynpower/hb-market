import { startTransition, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api, resolveAssetUrl } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { useI18n } from '../i18n';
import type { Product } from '../types';

export function ShopPage() {
  const { token, isAuthenticated, user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    void api
      .products('ON_SALE')
      .then((result) => {
        startTransition(() => setProducts(result));
      })
      .catch((requestError: Error) => {
        setError(requestError.message);
      });
  }, []);

  const filteredProducts = useMemo(() => {
    if (!deferredQuery.trim()) {
      return products;
    }

    const loweredQuery = deferredQuery.toLowerCase();
    return products.filter((product) =>
      `${product.name} ${product.description ?? ''}`.toLowerCase().includes(loweredQuery),
    );
  }, [deferredQuery, products]);

  if (user?.subject_type === 'ADMIN') {
    return <Navigate replace to="/admin" />;
  }

  async function handleAddToCart(product: Product) {
    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }

    const selectedOptionId = selectedOptions[product.id];
    const payload = {
      product_id: product.id,
      ...(selectedOptionId ? { product_option_id: selectedOptionId } : {}),
      quantity: 1,
    };

    try {
      setFeedback(null);
      await api.addCartItem(token, payload);
      setFeedback(`${product.name} added to cart`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to add item');
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-title-block">
          <p className="eyebrow">{t('shop.eyebrow')}</p>
          <h2>{t('shop.title')}</h2>
          <p className="muted">{t('shop.subtitle')}</p>
          <div className="hero-stats">
            <span className="meta-pill">{t('shop.visible', { count: filteredProducts.length })}</span>
            <span className="meta-pill alt">{t('shop.total', { count: products.length })}</span>
          </div>
        </div>
        <div className="search-panel">
          <label className="field-label" htmlFor="product-search">
            {t('shop.find')}
          </label>
          <input
            id="product-search"
            className="text-input"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('shop.search.placeholder')}
          />
        </div>
      </header>

      {feedback ? <p className="callout success">{feedback}</p> : null}
      {error ? <p className="callout error">{error}</p> : null}

      <div className="product-grid">
        {filteredProducts.map((product) => {
          const selectedOption =
            product.product_options.find((option) => option.id === selectedOptions[product.id]) ??
            product.product_options[0] ??
            null;
          const primaryImage =
            product.product_images.find((img) => img.is_primary) ||
            product.product_images[0] ||
            null;
          const fallback =
            'data:image/svg+xml;utf8,' +
            encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="%23e8ded0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23746453" font-family="Arial" font-size="28">No image</text></svg>`,
            );

          return (
            <article className="product-card" key={product.id}>
          {primaryImage ? (
            <div className="product-thumb">
              <img
                src={resolveAssetUrl(primaryImage.url)}
                alt={primaryImage.alt || product.name}
                loading="lazy"
              />
              <span className="thumb-pill">{primaryImage.alt || t('common.primaryImage')}</span>
            </div>
          ) : (
            <div className="product-thumb">
              <img src={fallback} alt={t('common.noImage')} loading="lazy" />
              <span className="thumb-pill">{t('shop.noImage')}</span>
            </div>
          )}
              <div className="product-head">
                <div>
                  <p className="product-kicker">{product.status}</p>
                  <h3>{product.name}</h3>
                </div>
                <strong>{formatCurrency(product.base_price)}</strong>
              </div>
              <p className="product-copy">
                {product.description || t('shop.fallbackDesc')}
              </p>
              {product.product_options.length ? (
                <label className="field-stack">
                  <span className="field-label">{t('shop.option')}</span>
                  <select
                    className="text-input"
                    value={selectedOptions[product.id] ?? product.product_options[0].id}
                    onChange={(event) =>
                      setSelectedOptions((current) => ({
                        ...current,
                        [product.id]: event.target.value,
                      }))
                    }
                  >
                    {product.product_options.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.option_name}: {option.option_value} ·{' '}
                        {formatCurrency(
                          Number(product.base_price) + Number(option.extra_price || 0),
                        )}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <p className="muted">{t('shop.noOptions')}</p>
              )}
              <div className="product-footer">
                <span className="pill">
                  {t('shop.stock', {
                    count: selectedOption
                      ? selectedOption.stock_qty
                      : product.product_options.length
                        ? product.product_options[0].stock_qty
                        : '-',
                  })}
                </span>
                <div className="product-actions">
                  <Link className="ghost-button" to={`/products/${product.id}`}>
                    {t('shop.details')}
                  </Link>
                  <button className="primary-button" onClick={() => void handleAddToCart(product)}>
                    {t('shop.addToCart')}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
