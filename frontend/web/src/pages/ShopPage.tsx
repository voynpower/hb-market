import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, resolveAssetUrl } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { useI18n } from '../i18n';
import { useWishlist } from '../context/WishlistContext';
import type { Category, Product } from '../types';

export function ShopPage() {
  const { t } = useI18n();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Sort State from URL
  const selectedCategory = searchParams.get('category_id') || '';
  const searchQuery = searchParams.get('search') || '';
  const sortOption = searchParams.get('sort') || 'latest';

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productsResult, categoriesResult] = await Promise.all([
        api.products('ON_SALE', selectedCategory, searchQuery, sortOption),
        api.categories(),
      ]);
      setProducts(productsResult);
      setCategories(categoriesResult);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load products');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, sortOption]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    
    setSearchParams(prev => {
      if (query) prev.set('search', query);
      else prev.delete('search');
      return prev;
    });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSearchParams(prev => {
      if (categoryId) prev.set('category_id', categoryId);
      else prev.delete('category_id');
      return prev;
    });
  };

  const handleSortChange = (sort: string) => {
    setSearchParams(prev => {
      prev.set('sort', sort);
      return prev;
    });
  };

  return (
    <section className="page shop-page">
      <header className="page-header">
        <div className="page-title-block">
          <p className="product-kicker">{t('shop.eyebrow')}</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-1px' }}>{t('shop.title')}</h2>
        </div>
      </header>

      <aside className="filters-bar" style={{ marginBottom: '40px', background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
        <div className="filters-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', alignItems: 'end' }}>
          
          <form className="search-box" onSubmit={handleSearch}>
            <label className="field-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 700 }}>{t('shop.find')}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                name="search"
                className="text-input" 
                defaultValue={searchQuery}
                placeholder={t('shop.search.placeholder')} 
              />
              <button className="primary-button" style={{ padding: '0 20px' }}>Go</button>
            </div>
          </form>

          <div className="filter-group">
            <label className="field-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 700 }}>{t('nav.categories') || 'Category'}</label>
            <select 
              className="text-input" 
              value={selectedCategory} 
              onChange={e => handleCategoryChange(e.target.value)}
            >
              <option value="">{t('admin.orderStatus.ALL') || 'All Categories'}</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="field-label" style={{ marginBottom: '8px', display: 'block', fontWeight: 700 }}>Sort By</label>
            <select 
              className="text-input" 
              value={sortOption} 
              onChange={e => handleSortChange(e.target.value)}
            >
              <option value="latest">Latest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>
      </aside>

      {isLoading ? (
        <div className="loading-state" style={{ padding: '80px', textAlign: 'center' }}>
          <p className="muted">Loading amazing products...</p>
        </div>
      ) : error ? (
        <div className="error-state callout error">{error}</div>
      ) : (
        <>
          <div className="shop-meta" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p className="muted" style={{ fontWeight: 600 }}>{t('shop.visible', { count: products.length })}</p>
          </div>

          <div className="products-grid">
            {products.map((product) => {
              const primaryImage = product.product_images.find((img) => img.is_primary) ?? product.product_images[0];
              const isFavorite = isInWishlist(product.id);

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
                      className={`wishlist-toggle ${isFavorite ? 'active' : ''}`} 
                      onClick={() => toggleWishlist(product.id)}
                      style={{ 
                        position: 'absolute', 
                        top: '12px', 
                        right: '12px', 
                        background: 'white', 
                        border: 'none', 
                        borderRadius: '50%', 
                        width: '36px', 
                        height: '36px', 
                        cursor: 'pointer', 
                        display: 'grid', 
                        placeItems: 'center', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        color: isFavorite ? 'var(--primary-color)' : '#ccc',
                        transition: 'all 0.2s ease',
                        fontSize: '1.2rem'
                      }}
                    >
                      {isFavorite ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <div className="product-card-info">
                    <p className="eyebrow">{product.categories?.name || 'General'}</p>
                    <Link to={`/products/${product.id}`}>
                      <h3 className="product-title">{product.name}</h3>
                    </Link>
                    <p className="product-desc">{product.description || t('shop.fallbackDesc')}</p>
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

          {!products.length && (
            <div className="empty-card" style={{ padding: '80px', textAlign: 'center' }}>
              <h3>No products found</h3>
              <p className="muted">Try adjusting your filters or search query.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
