import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api, resolveAssetUrl } from '../lib/api';
import { formatCurrency } from '../lib/format';
import { useI18n } from '../i18n';
import type { Address, Cart } from '../types';

export function CartPage() {
  const { token, isAuthenticated, user, refreshProfile } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [cart, setCart] = useState<Cart | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CARD');
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      return;
    }

    void Promise.all([api.getCart(token), api.me(token)])
      .then(([cartResult, profile]) => {
        setCart(cartResult);
        const nextAddresses = profile.addresses ?? [];
        setAddresses(nextAddresses);
        const defaultAddress =
          nextAddresses.find((address) => address.is_default) ?? nextAddresses[0];
        setSelectedAddressId(defaultAddress?.id ?? '');
      })
      .catch((requestError: Error) => {
        setError(requestError.message);
      });
  }, [token]);

  if (user?.subject_type === 'ADMIN') {
    return <Navigate replace to="/admin" />;
  }

  if (!isAuthenticated || !token || !user) {
    return <Navigate replace to="/login" />;
  }

  async function handleQuantityChange(cartItemId: string, quantity: number) {
    if (!token) {
      return;
    }

    try {
      const nextCart = await api.updateCartItem(token, cartItemId, quantity);
      setCart(nextCart);
      setNotice('Cart updated');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to update cart');
    }
  }

  async function handleRemove(cartItemId: string) {
    if (!token) {
      return;
    }

    try {
      const nextCart = await api.removeCartItem(token, cartItemId);
      setCart(nextCart);
      setNotice('Item removed');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to remove item');
    }
  }

  async function handleCheckout() {
    if (!token) {
      return;
    }

    if (!selectedAddressId) {
          setError(t('cart.selectAddressError'));
          return;
        }

    try {
      const order = await api.checkout(token, {
        address_id: selectedAddressId,
        payment_method: paymentMethod,
      });
      
      // If payment method is CARD, redirect to Stripe
      if (paymentMethod === 'CARD') {
        const { url } = await api.createPaymentSession(token, order.id);
        window.location.href = url;
        return;
      }

      setNotice(`Order ${order.order_number} created`);
      const nextCart = await api.getCart(token);
      setCart(nextCart);
      await refreshProfile();
      navigate('/orders');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Checkout failed');
    }
  }

  const total = cart?.cart_items.reduce(
    (sum, item) => sum + Number(item.unit_price) * item.quantity,
    0,
  ) ?? 0;
  const fallbackThumb =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23e8ded0"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23746453" font-family="Arial" font-size="18">No image</text></svg>`,
    );

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t('cart.eyebrow')}</p>
          <h2>{t('cart.title')}</h2>
        </div>
      </header>

      {notice ? <p className="callout success">{notice}</p> : null}
      {error ? <p className="callout error">{error}</p> : null}

      <div className="cart-layout">
        <div className="stack">
          {cart?.cart_items.length ? (
            cart.cart_items.map((item) => (
              <article className="line-card" key={item.id}>
                <div className="cart-line">
                  {item.products.product_images?.[0]?.url ? (
                    <div className="cart-thumb">
                      <img
                        src={resolveAssetUrl(item.products.product_images[0].url)}
                        alt={item.products.product_images[0].alt || item.products.name}
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="cart-thumb">
                      <img src={fallbackThumb} alt={t('common.noImage')} />
                    </div>
                  )}
                  <div>
                    <h3>{item.products.name}</h3>
                    <p className="muted">
                      {item.product_options
                        ? `${item.product_options.option_name}: ${item.product_options.option_value}`
                        : t('cart.baseProduct')}
                    </p>
                  </div>
                </div>
                <div className="line-actions">
                  <span className="price-tag">{formatCurrency(item.unit_price)}</span>
                  <input
                    className="small-input"
                    min={1}
                    type="number"
                    value={item.quantity}
                    onChange={(event) =>
                      void handleQuantityChange(item.id, Number(event.target.value))
                    }
                  />
                  <button
                    className="ghost-button"
                    onClick={() => void handleRemove(item.id)}
                    type="button"
                  >
                    {t('cart.remove')}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-card">
              <p>{t('cart.empty')}</p>
              <button className="primary-button" onClick={() => navigate('/')}>
                {t('cart.browse')}
              </button>
            </div>
          )}
        </div>

        <aside className="summary-card">
          <p className="eyebrow">{t('cart.checkout')}</p>
          <h3>{formatCurrency(total)}</h3>
          <label className="field-stack">
            <span className="field-label">{t('cart.shipping')}</span>
            <select
              className="text-input"
              value={selectedAddressId}
              onChange={(event) => setSelectedAddressId(event.target.value)}
            >
              <option value="">{t('cart.selectAddress')}</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.recipient_name} · {address.address1}
                </option>
              ))}
            </select>
          </label>
          {!addresses.length ? (
            <p className="muted">
              No saved address. <Link className="inline-link" to="/addresses">Add one first</Link>.
            </p>
          ) : null}

          <label className="field-stack">
            <span className="field-label">{t('cart.payment')}</span>
            <select
              className="text-input"
              value={paymentMethod}
              onChange={(event) => setPaymentMethod(event.target.value)}
            >
              <option value="CARD">{t('cart.pay.card')}</option>
              <option value="BANK_TRANSFER">{t('cart.pay.bank')}</option>
              <option value="CASH">{t('cart.pay.cash')}</option>
            </select>
          </label>

          <button
            className="primary-button wide-button"
            disabled={!cart?.cart_items.length}
            onClick={() => void handleCheckout()}
            type="button"
          >
            {t('cart.checkoutBtn')}
          </button>
        </aside>
      </div>
    </section>
  );
}
