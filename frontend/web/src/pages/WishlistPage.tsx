import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { api, resolveAssetUrl } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { useI18n } from '../i18n';
import type { Product } from '../types';

export function WishlistPage() {
  const { wishlist, toggleWishlist } = useWishlist();
  const { t } = useI18n();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadWishlistProducts() {
      if (wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        // Fetch all products and filter those in wishlist
        // (In a real app, we might have a bulk fetch by IDs endpoint)
        const allProducts = await api.products();
        const filtered = allProducts.filter(p => wishlist.includes(p.id));
        setProducts(filtered);
      } catch (e) {
        console.error('Failed to load wishlist products', e);
      } finally {
        setLoading(false);
      }
    }

    void loadWishlistProducts();
  }, [wishlist]);

  if (loading) return <div className="page">Loading wishlist...</div>;

  return (
    <section className="page wishlist-page">
      <header className="page-header" style={{ background: 'transparent', border: 'none', boxShadow: 'none', paddingLeft: 0, marginBottom: '32px' }}>
        <div className="page-title-block">
          <p className="product-kicker">{t('nav.wishlist') || 'Favorites'}</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{t('wishlist.title') || 'Your Wishlist'}</h2>
        </div>
      </header>

      {products.length === 0 ? (
        <div className="empty-card" style={{ padding: '80px', textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '24px' }}>❤️</div>
          <h3>{t('wishlist.empty') || 'Your wishlist is empty'}</h3>
          <p className="muted" style={{ marginBottom: '32px' }}>{t('wishlist.emptyDesc') || 'Save items you love to find them later.'}</p>
          <Link to="/" className="primary-button">{t('cart.browse')}</Link>
        </div>
      ) : (
        <div className="products-grid">
          {products.map((product) => {
            const primaryImage = product.product_images.find((img) => img.is_primary) ?? product.product_images[0];
            return (
              <article key={product.id} className="product-card">
                <div className="product-card-visual">
                  <Link to={`/products/${product.id}`}>
                    {primaryImage ? (
                      <img src={resolveAssetUrl(primaryImage.url)} alt={primaryImage.alt || product.name} />
                    ) : (
                      <div className="no-image-placeholder">{t('shop.noImage')}</div>
                    )}
                  </Link>
                  <button 
                    className="wishlist-toggle active" 
                    onClick={() => toggleWishlist(product.id)}
                    style={{ position: 'absolute', top: '12px', right: '12px', background: 'white', border: 'none', borderRadius: '50%', width: '36px', height: '36px', cursor: 'pointer', display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', color: 'var(--primary-color)' }}
                  >
                    ❤️
                  </button>
                </div>
                <div className="product-card-info">
                  <p className="eyebrow">{product.categories?.name || 'General'}</p>
                  <Link to={`/products/${product.id}`}>
                    <h3 className="product-title">{product.name}</h3>
                  </Link>
                  <strong className="product-price">{formatCurrency(product.base_price)}</strong>
                  <div style={{ marginTop: '16px' }}>
                    <Link to={`/products/${product.id}`} className="ghost-button wide-button" style={{ textAlign: 'center' }}>
                      {t('shop.details')}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
