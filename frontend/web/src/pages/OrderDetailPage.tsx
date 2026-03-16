import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api, resolveAssetUrl } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/format';
import { useI18n } from '../i18n';
import type { Order } from '../types';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const { t } = useI18n();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !token) return;

    setLoading(true);
    api.order(token, id)
      .then(setOrder)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, token]);

  if (loading) return <div className="page">Loading...</div>;
  if (error) return <div className="page error">Error: {error}</div>;
  if (!order) return <div className="page">Order not found</div>;

  // Timeline logic
  const statusSteps = ['CREATED', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
  const currentStepIndex = statusSteps.indexOf(order.delivery_status === 'DELIVERED' ? 'DELIVERED' : 
                           order.delivery_status === 'SHIPPED' ? 'SHIPPED' :
                           order.order_status === 'CONFIRMED' ? 'CONFIRMED' : 'CREATED');

  return (
    <section className="page order-detail">
      <header className="page-header" style={{ background: 'transparent', border: 'none', boxShadow: 'none', paddingLeft: 0, marginBottom: '24px' }}>
        <Link to="/orders" className="ghost-button">← {t('nav.orders')}</Link>
        <div>
          <p className="eyebrow">{t('order.detail.title') || 'Order Details'}</p>
          <h2>{order.order_number}</h2>
        </div>
      </header>

      {/* Order Status Timeline */}
      <div className="line-card status-timeline-card" style={{ padding: '40px', marginBottom: '32px' }}>
        <div className="timeline-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
          <div className="timeline-line" style={{ position: 'absolute', top: '15px', left: '0', right: '0', height: '2px', background: '#eee', zIndex: 0 }}></div>
          <div className="timeline-line-active" style={{ position: 'absolute', top: '15px', left: '0', width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`, height: '2px', background: 'var(--primary-color)', zIndex: 0, transition: 'width 1s ease' }}></div>
          
          {statusSteps.map((step, index) => (
            <div key={step} className="timeline-step" style={{ zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div className={`step-dot ${index <= currentStepIndex ? 'active' : ''}`} style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '50%', 
                background: index <= currentStepIndex ? 'var(--primary-color)' : '#fff',
                border: `2px solid ${index <= currentStepIndex ? 'var(--primary-color)' : '#eee'}`,
                display: 'grid',
                placeItems: 'center',
                color: index <= currentStepIndex ? '#fff' : '#ccc',
                fontWeight: 800,
                fontSize: '0.8rem',
                boxShadow: index === currentStepIndex ? '0 0 15px var(--primary-color)' : 'none'
              }}>
                {index < currentStepIndex ? '✓' : index + 1}
              </div>
              <span className="step-label" style={{ 
                fontSize: '0.75rem', 
                fontWeight: 700, 
                color: index <= currentStepIndex ? 'var(--text-dark)' : '#ccc' 
              }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dual-grid">
        <div className="stack">
          <h3>{t('order.items') || 'Ordered Items'}</h3>
          {order.order_items.map(item => {
            const primaryImage = item.products?.product_images?.[0];
            return (
              <article key={item.id} className="line-card" style={{ padding: '16px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div className="item-thumb" style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden', background: '#f5f5f5' }}>
                  {primaryImage ? (
                    <img src={resolveAssetUrl(primaryImage.url)} alt={item.product_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', color: '#ccc' }}>No Image</div>
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0 }}>{item.product_name}</h4>
                  {item.option_name && (
                    <p className="muted" style={{ fontSize: '0.85rem' }}>{item.option_name}: {item.option_value}</p>
                  )}
                  <p style={{ margin: '4px 0 0', fontWeight: 600 }}>{item.quantity} x {formatCurrency(item.unit_price)}</p>
                </div>
                <strong style={{ fontSize: '1.1rem' }}>{formatCurrency(item.total_price)}</strong>
              </article>
            );
          })}
        </div>

        <div className="stack">
          <h3>{t('order.info') || 'Order Summary'}</h3>
          <div className="form-card" style={{ padding: '24px' }}>
            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span>{t('order.date') || 'Order Date'}</span>
              <strong>{formatDate(order.created_at)}</strong>
            </div>
            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span>{t('order.status') || 'Status'}</span>
              <span className="pill">{order.order_status}</span>
            </div>
            <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span>{t('order.payment') || 'Payment'}</span>
              <span className="pill alt">{order.payment_status}</span>
            </div>
            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />
            <div className="summary-row total" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.4rem', fontWeight: 800 }}>
              <span>{t('cart.total') || 'Total'}</span>
              <span style={{ color: 'var(--primary-color)' }}>{formatCurrency(order.total_amount)}</span>
            </div>
          </div>

          <h3 style={{ marginTop: '32px' }}>{t('order.delivery') || 'Delivery Address'}</h3>
          <div className="line-card" style={{ padding: '24px' }}>
            {order.addresses ? (
              <div className="address-info">
                <strong style={{ display: 'block', marginBottom: '8px' }}>{order.addresses.recipient_name}</strong>
                <p className="muted">{order.addresses.recipient_phone}</p>
                <p style={{ marginTop: '12px' }}>{order.addresses.address1}</p>
                {order.addresses.address2 && <p>{order.addresses.address2}</p>}
                <p className="muted" style={{ fontSize: '0.85rem', marginTop: '8px' }}>{order.addresses.zip_code}</p>
              </div>
            ) : (
              <p className="muted">Address information unavailable</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
