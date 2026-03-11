import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api, resolveAssetUrl } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { useI18n } from '../i18n';
import type { Product } from '../types';

export function ProductDetailPage() {
  const { productId } = useParams();
  const { token, isAuthenticated, user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      return;
    }

    void api
      .product(productId)
      .then((result) => {
        setProduct(result);
        setSelectedOptionId(result.product_options[0]?.id ?? '');
      })
      .catch((requestError: Error) => {
        setError(requestError.message);
      });
  }, [productId]);

  const selectedOption = useMemo(() => {
    if (!product) {
      return null;
    }

    return (
      product.product_options.find((option) => option.id === selectedOptionId) ??
      product.product_options[0] ??
      null
    );
  }, [product, selectedOptionId]);

  if (!productId) {
    return <Navigate replace to="/" />;
  }

  if (user?.subject_type === 'ADMIN') {
    return <Navigate replace to="/admin" />;
  }

  async function handleAddToCart() {
    if (!product) {
      return;
    }

    if (!isAuthenticated || !token) {
      navigate('/login');
      return;
    }

    try {
      setError(null);
      setFeedback(null);
      await api.addCartItem(token, {
        product_id: product.id,
        ...(selectedOption ? { product_option_id: selectedOption.id } : {}),
        quantity: 1,
      });
      setFeedback(`${product.name} added to cart`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to add item');
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t('detail.eyebrow')}</p>
          <h2>{t('detail.title')}</h2>
        </div>
        <Link className="ghost-button" to="/">
          {t('detail.back')}
        </Link>
      </header>

      {feedback ? <p className="callout success">{feedback}</p> : null}
      {error ? <p className="callout error">{error}</p> : null}

      {product ? (
        <div className="detail-layout">
          <article className="product-card detail-card">
            {product.product_images.length ? (
              <div className="product-hero">
                <img
                  src={resolveAssetUrl(product.product_images[0].url)}
                  alt={product.product_images[0].alt || product.name}
                  loading="lazy"
                />
                <span className="thumb-pill">
                  {product.product_images[0].alt || t('common.primaryImage')}
                </span>
              </div>
            ) : (
              <div className="product-hero">
                <img
                  src={
                    'data:image/svg+xml;utf8,' +
                    encodeURIComponent(
                      `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500"><rect width="800" height="500" fill="%23e8ded0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23746453" font-family="Arial" font-size="32">No image</text></svg>`,
                    )
                  }
                  alt={t('common.noImage')}
                  loading="lazy"
                />
                <span className="thumb-pill">{t('common.noImage')}</span>
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
                {product.description || t('detail.noDescription')}
              </p>
              <div className="chip-row">
                <span className="chip">Created {new Date(product.created_at).toLocaleDateString()}</span>
                <span className="chip">Variants {product.product_options.length}</span>
            </div>
          </article>

          <aside className="summary-card">
            <p className="eyebrow">{t('detail.purchase')}</p>
            <h3>
              {formatCurrency(
                Number(product.base_price) + Number(selectedOption?.extra_price ?? 0),
              )}
            </h3>

            {product.product_options.length ? (
              <label className="field-stack">
                <span className="field-label">{t('detail.option')}</span>
                <select
                  className="text-input"
                  value={selectedOptionId}
                  onChange={(event) => setSelectedOptionId(event.target.value)}
                >
                  {product.product_options.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.option_name}: {option.option_value} · stock {option.stock_qty}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <p className="muted">{t('detail.noOptions')}</p>
            )}

            {selectedOption ? (
              <div className="stack compact-stack">
                <div className="summary-strip">
                  <span>{t('detail.variant')}</span>
                  <strong>
                    {selectedOption.option_name}: {selectedOption.option_value}
                  </strong>
                </div>
                <div className="summary-strip">
                  <span>{t('detail.stock')}</span>
                  <strong>{selectedOption.stock_qty}</strong>
                </div>
                <div className="summary-strip">
                  <span>{t('detail.sku')}</span>
                  <strong>{selectedOption.sku || '-'}</strong>
                </div>
              </div>
            ) : null}

            <button className="primary-button wide-button" onClick={() => void handleAddToCart()}>
              {t('detail.addToCart')}
            </button>
          </aside>
        </div>
      ) : (
        <div className="empty-card">
          <p>Loading product detail...</p>
        </div>
      )}
    </section>
  );
}
