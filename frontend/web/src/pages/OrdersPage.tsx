import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/format';
import { useI18n } from '../i18n';
import type { Order } from '../types';

export function OrdersPage() {
  const { token, isAuthenticated, user } = useAuth();
  const { t } = useI18n();
  const [orders, setOrders] = useState<Order[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    void api
      .myOrders(token)
      .then((result) => {
        setOrders(result);
      })
      .catch((requestError: Error) => {
        setError(requestError.message);
      });
  }, [token]);

  if (user?.subject_type === 'ADMIN') {
    return <Navigate replace to="/admin" />;
  }

  if (!isAuthenticated || !token) {
    return <Navigate replace to="/login" />;
  }

  async function loadOrders(currentToken: string) {
    const result = await api.myOrders(currentToken);
    setOrders(result);
  }

  async function handleCancel(orderId: string) {
    const currentToken = token;
    if (!currentToken) {
      return;
    }

    try {
      setError(null);
      setNotice(null);
      await api.cancelOrder(currentToken, orderId);
      await loadOrders(currentToken);
      setNotice(t('orders.noticeCancelled', { id: orderId }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : t('orders.error'));
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t('orders.eyebrow')}</p>
          <h2>{t('orders.title')}</h2>
        </div>
      </header>

      {notice ? <p className="callout success">{notice}</p> : null}
      {error ? <p className="callout error">{error}</p> : null}

      <div className="stack">
        {orders.map((order) => (
          <article className="line-card order-card" key={order.id}>
            <div className="order-title-row">
              <div>
                <p className="eyebrow">#{order.order_number}</p>
                <h3>{formatCurrency(order.total_amount)}</h3>
              </div>
              <div className="order-statuses">
                <span className="pill">{order.order_status}</span>
                <span className="pill alt">{order.payment_status}</span>
                <span className="pill outline">{order.delivery_status}</span>
              </div>
            </div>
            <p className="muted">{formatDate(order.created_at)}</p>
            <div className="chip-row">
              {order.order_items.map((item) => (
                <span className="chip" key={item.id}>
                  {item.product_name} x{item.quantity}
                </span>
              ))}
            </div>
            <div className="admin-actions">
              <Link className="ghost-button" to={`/orders/${order.id}`}>
                {t('order.viewDetails') || 'View Details'}
              </Link>
              {order.order_status !== 'CANCELLED' && order.delivery_status === 'READY' ? (
                <button
                  className="ghost-button danger-button"
                  onClick={() => void handleCancel(order.id)}
                  type="button"
                >
                  {t('orders.cancel')}
                </button>
              ) : null}
            </div>
          </article>
        ))}

        {!orders.length ? (
          <div className="empty-card">
            <p>{t('orders.none')}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
