import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api, resolveAssetUrl } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/format';
import { useI18n } from '../i18n';
import type { AdminDashboard, Category, Order, Product } from '../types';

const emptyProductForm = {
  category_id: '',
  name: '',
  description: '',
  base_price: '0.00',
  status: 'ON_SALE',
  image_url: '',
  image_alt: '',
  option_name: '',
  option_value: '',
  extra_price: '0.00',
  stock_qty: 0,
  sku: '',
};

export function AdminPage() {
  const { token, user } = useAuth();
  const { t } = useI18n();
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Settings management state
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showProfileManager, setShowProfileManager] = useState(false);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    current_password: '',
    new_password: '',
  });

  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [orderQuery, setOrderQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  
  // Quick Stock Edit State
  const [editingStockOptionId, setEditingStockOptionId] = useState<string | null>(null);
  const [quickStockValue, setQuickStockValue] = useState<number>(0);

  const loadAdminData = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const [dashboardResult, ordersResult, productsResult, categoriesResult] = await Promise.all([
        api.adminDashboard(token),
        api.allOrders(token),
        api.products(),
        api.categories(),
      ]);
      setDashboard(dashboardResult);
      setOrders(ordersResult);
      setProducts(productsResult);
      setCategories(categoriesResult);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to load admin data');
    }
  }, [token]);

  useEffect(() => {
    if (!token || user?.subject_type !== 'ADMIN') {
      return;
    }

    void loadAdminData();
  }, [loadAdminData, token, user?.subject_type]);

  const filteredOrders = useMemo(() => {
    const loweredQuery = orderQuery.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesQuery =
        !loweredQuery ||
        `${order.order_number} ${order.users?.email ?? ''} ${order.users?.name ?? ''}`
          .toLowerCase()
          .includes(loweredQuery);

      const matchesStatus =
        orderStatusFilter === 'ALL' ||
        order.order_status === orderStatusFilter ||
        order.payment_status === orderStatusFilter ||
        order.delivery_status === orderStatusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [orderQuery, orderStatusFilter, orders]);

  if (!token || !user) {
    return <Navigate replace to="/admin/login" />;
  }

  if (user.subject_type !== 'ADMIN') {
    return <Navigate replace to="/" />;
  }

  function resetProductForm() {
    setEditingProductId(null);
    setProductForm(emptyProductForm);
    setUploadPreview(null);
    setNotice(null);
    setError(null);
  }

  function startEditProduct(product: Product) {
    const firstOption = product.product_options[0];
    const primaryImage = product.product_images?.find((img) => img.is_primary) ?? product.product_images?.[0];
    
    // Clear notifications
    setNotice(null);
    setError(null);
    
    setEditingProductId(product.id);
    setProductForm({
      category_id: product.category_id ?? '',
      name: product.name,
      description: product.description ?? '',
      base_price: product.base_price,
      status: product.status,
      image_url: primaryImage?.url ?? '',
      image_alt: '',
      option_name: firstOption?.option_name ?? '',
      option_value: firstOption?.option_value ?? '',
      extra_price: firstOption?.extra_price ?? '0.00',
      stock_qty: firstOption?.stock_qty ?? 0,
      sku: firstOption?.sku ?? '',
    });
    setUploadPreview(primaryImage ? resolveAssetUrl(primaryImage.url) : null);
    
    // Smooth scroll to the top where the form is
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleSaveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || uploading) {
      return;
    }

    setError(null);
    setNotice(null);

    // Prepare payload carefully
    const payload: any = {
      category_id: productForm.category_id || undefined,
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      base_price: productForm.base_price || '0.00',
      status: productForm.status,
    };

    // Images array (overwrite or update)
    if (productForm.image_url) {
      payload.images = [
        {
          url: productForm.image_url,
          alt: productForm.image_alt || undefined,
          is_primary: true,
          sort_order: 0,
        },
      ];
    } else {
      payload.images = []; // Explicitly clear images if none provided
    }

    // Options array
    if (productForm.option_name && productForm.option_value) {
      payload.options = [
        {
          option_name: productForm.option_name.trim(),
          option_value: productForm.option_value.trim(),
          extra_price: productForm.extra_price || '0.00',
          stock_qty: productForm.stock_qty,
          sku: productForm.sku?.trim() || undefined,
        },
      ];
    }

    try {
      if (editingProductId) {
        await api.updateProduct(token, editingProductId, payload);
        setNotice('Product updated successfully');
      } else {
        await api.createProduct(token, payload);
        setNotice('Product created successfully');
      }

      resetProductForm();
      await loadAdminData();
    } catch (requestError) {
      console.error('Save failed:', requestError);
      setError(requestError instanceof Error ? requestError.message : 'Unable to save product');
    }
  }

  async function handleDeleteProduct(productId: string) {
    if (!token) return;
    
    // Simple confirmation
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      setError(null);
      setNotice(null);
      await api.deleteProduct(token, productId);
      
      if (editingProductId === productId) {
        resetProductForm();
      }
      
      setNotice('Product deleted successfully');
      await loadAdminData();
    } catch (requestError) {
      console.error('Delete failed:', requestError);
      setError(requestError instanceof Error ? requestError.message : 'Unable to delete product');
    }
  }

  async function handleUpdateStatus(orderId: string, payload: Record<string, string>) {
    if (!token) {
      return;
    }

    try {
      setError(null);
      setNotice(null);
      await api.updateOrderStatus(token, orderId, payload);
      setNotice(`Order ${orderId} updated`);
      await loadAdminData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update order');
    }
  }

  async function handleExportCsv() {
    if (!token) return;
    try {
      const csvData = await api.exportOrdersCsv(token);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setNotice('CSV Export successful');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    }
  }

  async function handleCreateCategory() {
    if (!token || !newCategoryName.trim()) return;
    try {
      await api.createCategory(token, { name: newCategoryName, description: newCategoryDesc });
      setNewCategoryName('');
      setNewCategoryDesc('');
      await loadAdminData();
      setNotice('Category created');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create category');
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!token || !window.confirm('Delete this category?')) return;
    try {
      await api.deleteCategory(token, id);
      await loadAdminData();
      setNotice('Category deleted');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete category');
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      const payload = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        current_password: profileForm.current_password || undefined,
        new_password: profileForm.new_password || undefined,
      };
      await api.updateAdminProfile(token, payload);
      setNotice('Profile updated successfully. Please sign in again if you changed email or password.');
      setProfileForm(prev => ({ ...prev, current_password: '', new_password: '' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update profile');
    }
  }

  async function handleQuickStockUpdate(optionId: string, newQty: number) {
    if (!token) return;
    try {
      await api.updateProductStock(token, optionId, newQty);
      setEditingStockOptionId(null);
      setNotice('Stock updated successfully');
      await loadAdminData();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update stock');
    }
  }

  return (
    <section className="page admin-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t('admin.eyebrow')}</p>
          <h2>{t('admin.title')}</h2>
        </div>
        <div className="header-actions">
          <button 
            className="ghost-button" 
            onClick={() => { setShowCategoryManager(!showCategoryManager); setShowProfileManager(false); }}
          >
            {showCategoryManager ? 'Hide Categories' : 'Manage Categories'}
          </button>
          <button 
            className="ghost-button" 
            onClick={() => { setShowProfileManager(!showProfileManager); setShowCategoryManager(false); }}
          >
            {showProfileManager ? 'Hide Settings' : 'Account Settings'}
          </button>
        </div>
      </header>

      {notice ? <p className="callout success">{notice}</p> : null}
      {error ? <p className="callout error">{error}</p> : null}

      {/* Low Stock Alerts */}
      {dashboard?.low_stock_items.length ? (
        <article className="callout error" style={{ background: '#fff5f5', borderColor: '#feb2b2', marginBottom: '24px', display: 'block' }}>
          <strong style={{ color: '#c53030' }}>⚠️ Low Stock Alert:</strong>
          <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>
            {dashboard.low_stock_items.map(item => (
              <span key={item.id} style={{ marginRight: '16px', display: 'inline-block' }}>
                • {item.products.name} ({item.option_name}: {item.option_value}) - <strong>{item.stock_qty} left</strong>
              </span>
            ))}
          </div>
        </article>
      ) : null}

      {showCategoryManager && (
        <article className="form-card category-manager" style={{ marginBottom: '24px' }}>
          <h3>{t('nav.categories') || 'Categories'}</h3>
          <div className="dual-grid" style={{ marginBottom: '16px' }}>
            <label className="field-stack">
              <span className="field-label">{t('admin.categoryName') || 'Category Name'}</span>
              <input 
                className="text-input" 
                value={newCategoryName} 
                onChange={e => setNewCategoryName(e.target.value)} 
                placeholder="e.g. Ceramics"
              />
            </label>
            <label className="field-stack">
              <span className="field-label">{t('admin.description')} ({t('common.optional') || 'Optional'})</span>
              <input 
                className="text-input" 
                value={newCategoryDesc} 
                onChange={e => setNewCategoryDesc(e.target.value)} 
              />
            </label>
          </div>
          <button className="primary-button" onClick={() => void handleCreateCategory()}>{t('admin.addCategory') || 'Add Category'}</button>
          
          <div className="chip-row" style={{ marginTop: '20px' }}>
            {categories.map(cat => (
              <span key={cat.id} className="pill">
                {cat.name}
                <button 
                  onClick={() => void handleDeleteCategory(cat.id)}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', marginLeft: '8px', color: 'inherit' }}
                >✕</button>
              </span>
            ))}
          </div>
        </article>
      )}

      {showProfileManager && (
        <article className="form-card profile-manager" style={{ marginBottom: '24px' }}>
          <h3>{t('admin.accountSettings') || 'Account Settings'}</h3>
          <form onSubmit={(e) => void handleUpdateProfile(e)}>
            <div className="dual-grid" style={{ marginBottom: '16px' }}>
              <label className="field-stack">
                <span className="field-label">{t('login.name')}</span>
                <input 
                  className="text-input" 
                  value={profileForm.name} 
                  onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} 
                />
              </label>
              <label className="field-stack">
                <span className="field-label">{t('login.email')}</span>
                <input 
                  className="text-input" 
                  type="email"
                  value={profileForm.email} 
                  onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))} 
                />
              </label>
            </div>
            <div className="dual-grid" style={{ marginBottom: '16px' }}>
              <label className="field-stack">
                <span className="field-label">{t('admin.currentPassword') || 'Current Password'}</span>
                <input 
                  className="text-input" 
                  type="password"
                  value={profileForm.current_password} 
                  onChange={e => setProfileForm(p => ({ ...p, current_password: e.target.value }))} 
                />
              </label>
              <label className="field-stack">
                <span className="field-label">{t('admin.newPassword') || 'New Password'}</span>
                <input 
                  className="text-input" 
                  type="password"
                  value={profileForm.new_password} 
                  onChange={e => setProfileForm(p => ({ ...p, new_password: e.target.value }))} 
                  placeholder="Min 8 characters"
                />
              </label>
            </div>
            <button className="primary-button" type="submit">{t('admin.updateProfile') || 'Update Profile'}</button>
          </form>
        </article>
      )}

      {dashboard ? (
        <div className="metrics-grid">
          <article className="line-card metric-card">
            <p className="eyebrow">{t('admin.metrics.users')}</p>
            <h3>{dashboard.metrics.users}</h3>
          </article>
          <article className="line-card metric-card">
            <p className="eyebrow">{t('admin.metrics.products')}</p>
            <h3>{dashboard.metrics.products}</h3>
          </article>
          <article className="line-card metric-card">
            <p className="eyebrow">{t('admin.metrics.orders')}</p>
            <h3>{dashboard.metrics.orders}</h3>
          </article>
          <article className="line-card metric-card">
            <p className="eyebrow">{t('admin.metrics.revenue')}</p>
            <h3>{formatCurrency(dashboard.metrics.paid_revenue)}</h3>
          </article>
          <article className="line-card metric-card" style={{ borderColor: (dashboard.metrics.low_stock_count > 0) ? '#feb2b2' : 'inherit' }}>
            <p className="eyebrow">Low Stock Items</p>
            <h3 style={{ color: (dashboard.metrics.low_stock_count > 0) ? '#c53030' : 'inherit' }}>{dashboard.metrics.low_stock_count}</h3>
          </article>
        </div>
      ) : null}

      <div className="admin-grid">
        <div className="stack">
          <form className="form-card" onSubmit={(event) => void handleSaveProduct(event)}>
            <div className="section-heading">
              <h3>{editingProductId ? t('admin.edit') : t('admin.create')}</h3>
              {editingProductId ? (
                <button className="ghost-button" onClick={resetProductForm} type="button">
                  {t('admin.reset')}
                </button>
              ) : null}
            </div>

            <div className="dual-grid">
              <label className="field-stack">
                <span className="field-label">{t('admin.name')}</span>
                <input
                  className="text-input"
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
              </label>
              <label className="field-stack">
                <span className="field-label">{t('nav.categories') || 'Category'}</span>
                <select
                  className="text-input"
                  value={productForm.category_id}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, category_id: event.target.value }))
                  }
                >
                  <option value="">{t('admin.noCategory') || 'No Category'}</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="dual-grid">
              <label className="field-stack">
              <span className="field-label">{t('admin.upload')}</span>
                <div className="upload-row">
                  <input
                    className="text-input"
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file || !token) return;
                      setError(null);
                      setNotice(null);
                      setUploading(true);
                      try {
                        const result = await api.uploadImage(token, file);
                        const resolved = resolveAssetUrl(result.url);
                        setProductForm((current) => ({
                          ...current,
                          image_url: result.url, // Store relative path in form state
                          image_alt: '', // Clear alt text so filename doesn't show up
                        }));
                        setUploadPreview(resolved); // Keep absolute path for preview <img> src
                        setNotice('Image uploaded');
                      } catch (uploadError) {
                        setError(uploadError instanceof Error ? uploadError.message : 'Upload failed');
                      } finally {
                        setUploading(false);
                        event.target.value = '';
                      }
                    }}
                  />
                  {uploading ? <p className="muted">{t('common.uploading')}</p> : null}
                </div>
              </label>
              {uploadPreview ? (
                <div className="product-thumb preview-thumb">
                  <img src={uploadPreview} alt={productForm.image_alt || 'Uploaded preview'} />
                  <button
                    className="ghost-button"
                    type="button"
                    onClick={() => {
                      setProductForm((c) => ({ ...c, image_url: '', image_alt: '' }));
                      setUploadPreview(null);
                    }}
                  >
                    {t('common.remove')}
                  </button>
                </div>
              ) : null}
            </div>

            <label className="field-stack">
                <span className="field-label">{t('admin.description')}</span>
              <textarea
                className="text-area"
                value={productForm.description}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>

            <div className="dual-grid">
              <label className="field-stack">
                <span className="field-label">{t('admin.basePrice')}</span>
                <input
                  className="text-input"
                  value={productForm.base_price}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      base_price: event.target.value,
                    }))
                  }
                  required
                />
              </label>
              <label className="field-stack">
                <span className="field-label">{t('admin.status')}</span>
                <select
                  className="text-input"
                  value={productForm.status}
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      status: event.target.value,
                    }))
                  }
                >
                  <option value="ON_SALE">ON_SALE</option>
                  <option value="OFF_SALE">OFF_SALE</option>
                </select>
              </label>
            </div>

            <div className="subsection">
              <p className="subsection-title">{t('admin.variant')}</p>
              <div className="dual-grid">
                <label className="field-stack">
                  <span className="field-label">{t('admin.optionName')}</span>
                  <input
                    className="text-input"
                    value={productForm.option_name}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        option_name: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field-stack">
                  <span className="field-label">{t('admin.optionValue')}</span>
                  <input
                    className="text-input"
                    value={productForm.option_value}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        option_value: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <div className="triple-grid">
                <label className="field-stack">
                  <span className="field-label">{t('admin.extraPrice')}</span>
                  <input
                    className="text-input"
                    value={productForm.extra_price}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        extra_price: event.target.value,
                      }))
                    }
                  />
                </label>
                <label className="field-stack">
                  <span className="field-label">{t('admin.stockQty')}</span>
                  <input
                    className="text-input"
                    min={0}
                    type="number"
                    value={productForm.stock_qty}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        stock_qty: Number(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className="field-stack">
                  <span className="field-label">{t('admin.sku')}</span>
                  <input
                    className="text-input"
                    value={productForm.sku}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        sku: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button className="primary-button" type="submit" disabled={uploading}>
                {editingProductId ? t('admin.save') : t('admin.publish')}
              </button>
              {editingProductId ? (
                <button className="ghost-button" onClick={resetProductForm} type="button">
                  {t('admin.cancel')}
                </button>
              ) : null}
            </div>
          </form>

          <div className="stack">
            {products.map((product) => {
              const primaryImage =
                product.product_images?.find((img) => img.is_primary) ??
                product.product_images?.[0];
              return (
                <article className="line-card" key={product.id}>
                  <div className="section-heading">
                    <div className="product-info-row">
                      {primaryImage ? (
                        <div className="product-thumb list-thumb">
                          <img
                            src={resolveAssetUrl(primaryImage.url)}
                            alt={primaryImage.alt || product.name}
                          />
                        </div>
                      ) : null}
                      <div>
                        <p className="eyebrow">{product.status} {product.categories ? `· ${product.categories.name}` : ''}</p>
                        <h3>{product.name}</h3>
                      </div>
                    </div>
                    <strong>{formatCurrency(product.base_price)}</strong>
                  </div>
                  <p className="muted">{product.description || t('admin.noDesc')}</p>
                  <div className="chip-row">
                    {product.product_options.length ? (
                      product.product_options.map((option) => (
                        <span className="chip" key={option.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                          {option.option_name}: {option.option_value} · stock 
                          {editingStockOptionId === option.id ? (
                            <input 
                              type="number" 
                              className="text-input" 
                              style={{ width: '60px', padding: '2px 4px', fontSize: '0.8rem', height: 'auto' }}
                              value={quickStockValue}
                              onChange={e => setQuickStockValue(Number(e.target.value))}
                              onBlur={() => void handleQuickStockUpdate(option.id, quickStockValue)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') void handleQuickStockUpdate(option.id, quickStockValue);
                                if (e.key === 'Escape') setEditingStockOptionId(null);
                              }}
                              autoFocus
                            />
                          ) : (
                            <strong 
                              style={{ cursor: 'pointer', textDecoration: 'underline dotted', color: option.stock_qty <= 5 ? 'var(--primary-color)' : 'inherit' }}
                              onClick={() => {
                                setEditingStockOptionId(option.id);
                                setQuickStockValue(option.stock_qty);
                              }}
                              title="Click to edit stock"
                            >
                              {option.stock_qty}
                            </strong>
                          )}
                        </span>
                      ))
                    ) : (
                      <span className="chip">{t('admin.noVariants')}</span>
                    )}
                  </div>
                  <div className="admin-actions">
                    <button
                      className="ghost-button"
                      onClick={() => startEditProduct(product)}
                      type="button"
                    >
                      {t('admin.editBtn')}
                    </button>
                    <button
                      className="ghost-button danger-button"
                      onClick={() => void handleDeleteProduct(product.id)}
                      type="button"
                    >
                      {t('admin.deleteBtn')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="stack">
          <div className="line-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">{t('admin.orderFilters')}</p>
                <h3>{t('admin.orderSearch')}</h3>
              </div>
              <button className="ghost-button" onClick={() => void handleExportCsv()} disabled={orders.length === 0}>
                📥 Export Orders (CSV)
              </button>
            </div>
            <div className="dual-grid">
              <label className="field-stack">
                <span className="field-label">{t('admin.search')}</span>
                <input
                  className="text-input"
                  placeholder={t('admin.orderSearch')}
                  value={orderQuery}
                  onChange={(event) => setOrderQuery(event.target.value)}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">{t('admin.statusLabel')}</span>
                <select
                  className="text-input"
                  value={orderStatusFilter}
                  onChange={(event) => setOrderStatusFilter(event.target.value)}
                >
                  <option value="ALL">ALL</option>
                  <option value="CREATED">CREATED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="CANCELLED">CANCELLED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="REFUNDED">REFUNDED</option>
                  <option value="READY">READY</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              </label>
            </div>
          </div>

          <div className="line-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Recent</p>
                <h3>{t('admin.recent')}</h3>
              </div>
            </div>
            <div className="stack compact-stack">
              {dashboard?.recent_orders.map((order) => (
                <article className="summary-strip" key={order.id}>
                  <div>
                    <strong>{order.order_number}</strong>
                    <p className="muted">{order.users?.email ?? t('admin.tag.user')}</p>
                  </div>
                  <span className="pill">{formatCurrency(order.total_amount)}</span>
                </article>
              ))}
            </div>
          </div>

          {filteredOrders.map((order) => (
            <article className="line-card admin-order-card" key={order.id}>
              <div className="order-title-row">
                <div>
                  <p className="eyebrow">{order.users?.email ?? t('admin.tag.user')}</p>
                  <h3>{order.order_number}</h3>
                </div>
                <strong>{formatCurrency(order.total_amount)}</strong>
              </div>
              <p className="muted">{formatDate(order.created_at)}</p>
              <div className="chip-row">
                <span className="chip">{order.order_status}</span>
                <span className="chip">{order.payment_status}</span>
                <span className="chip">{order.delivery_status}</span>
              </div>
              <div className="admin-actions">
                <button
                  className="ghost-button"
                  onClick={() => void handleUpdateStatus(order.id, { order_status: 'CONFIRMED' })}
                  type="button"
                >
                  {t('admin.action.confirm')}
                </button>
                <button
                  className="ghost-button"
                  onClick={() => void handleUpdateStatus(order.id, { payment_status: 'PAID' })}
                  type="button"
                >
                  {t('admin.action.paid')}
                </button>
                <button
                  className="ghost-button"
                  onClick={() =>
                    void handleUpdateStatus(order.id, {
                      delivery_status: 'SHIPPED',
                      courier: 'CJ Logistics',
                      tracking_number: `TRK-${order.id}`,
                    })
                  }
                  type="button"
                >
                  {t('admin.action.ship')}
                </button>
                <button
                  className="ghost-button"
                  onClick={() => void handleUpdateStatus(order.id, { delivery_status: 'DELIVERED' })}
                  type="button"
                >
                  {t('admin.action.deliver')}
                </button>
              </div>
            </article>
          ))}

          {!orders.length ? (
            <div className="empty-card">
              <p>{t('admin.orders.none')}</p>
            </div>
          ) : !filteredOrders.length ? (
            <div className="empty-card">
              <p>{t('admin.orders.noMatch')}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
