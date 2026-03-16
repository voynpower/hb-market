import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api, resolveAssetUrl } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { useI18n } from '../i18n';
import { useWishlist } from '../context/WishlistContext';
import type { Product } from '../types';

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token, isAuthenticated } = useAuth();
  const { t } = useI18n();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    
    setIsLoading(true);
    api.product(id)
      .then((p) => {
        setProduct(p);
        if (p.product_options.length > 0) {
          setSelectedOptionId(p.product_options[0].id);
        }
      })
      .catch((e) => {
        setError(e.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  if (isLoading) return <div className="page">Loading...</div>;
  if (error && !product) return <div className="page error">Error: {error}</div>;
  if (!product) return <div className="page">Product not found</div>;

  const selectedOption = product.product_options.find(o => o.id === selectedOptionId);
  const price = Number(product.base_price) + Number(selectedOption?.extra_price || 0);

  async function handleAddToCart() {
    if (!isAuthenticated || !token || !id) {
      navigate('/login');
      return;
    }
    try {
      setFeedback(null);
      await api.addCartItem(token, {
        product_id: id,
        product_option_id: selectedOptionId || undefined,
        quantity
      });
      setFeedback('✓ Item added to cart');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add to cart');
    }
  }

  return (
    <section className="page product-detail">
      <header className="page-header" style={{ background: 'transparent', border: 'none', boxShadow: 'none', paddingLeft: 0, marginBottom: '24px' }}>
        <Link to="/" className="ghost-button" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>← {t('nav.shop')}</Link>
      </header>

      <div className="product-layout dual-grid">
        <div className="product-visuals">
          {product.product_images.length > 0 ? (
            product.product_images.map(img => (
              <div key={img.id} className="product-thumb" style={{ height: 'auto', marginBottom: '16px' }}>
                <img 
                  src={resolveAssetUrl(img.url)} 
                  alt={img.alt || product.name} 
                  style={{ width: '100%', display: 'block' }}
                />
              </div>
            ))
          ) : (
            <div className="product-thumb" style={{ height: '300px', display: 'grid', placeItems: 'center' }}>
              <p className="muted">No images available</p>
            </div>
          )}
        </div>

        <div className="product-info stack" style={{ gap: '24px' }}>
          <div>
            <p className="product-kicker">{product.categories?.name || 'General'}</p>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>{product.name}</h2>
          </div>

          <strong style={{ fontSize: '2rem', color: 'var(--primary-color)' }}>{formatCurrency(price)}</strong>
          
          <p className="product-copy" style={{ fontSize: '1.1rem', lineHeight: 1.7 }}>{product.description}</p>

          <div className="purchase-card form-card" style={{ padding: '24px' }}>
            {product.product_options.length > 0 && (
              <label className="field-stack" style={{ marginBottom: '20px' }}>
                <span className="field-label">{t('shop.option')}</span>
                <select 
                  className="text-input" 
                  value={selectedOptionId}
                  onChange={e => setSelectedOptionId(e.target.value)}
                >
                  {product.product_options.map(o => (
                    <option key={o.id} value={o.id}>{o.option_name}: {o.option_value}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="field-stack" style={{ marginBottom: '24px' }}>
              <span className="field-label">{t('shop.quantity')}</span>
              <input 
                type="number" 
                className="text-input" 
                min={1} 
                value={quantity} 
                onChange={e => setQuantity(Number(e.target.value))} 
              />
            </label>

            <button className="primary-button wide-button" onClick={() => void handleAddToCart()}>
              {t('shop.addToCart')}
            </button>

            <button 
              className="ghost-button wide-button" 
              style={{ marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              onClick={() => id && toggleWishlist(id)}
            >
              {id && isInWishlist(id) ? '❤️' : '🤍'} {t('nav.wishlist') || 'Wishlist'}
            </button>
            
            {feedback && <p className="callout success" style={{ marginTop: '16px' }}>{feedback}</p>}
            {error && <p className="callout error" style={{ marginTop: '16px' }}>{error}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
