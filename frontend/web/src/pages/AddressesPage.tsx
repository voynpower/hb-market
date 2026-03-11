import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/api';
import { formatDate } from '../lib/format';
import { useI18n } from '../i18n';
import type { Address } from '../types';

const emptyForm = {
  recipient_name: '',
  recipient_phone: '',
  zip_code: '',
  address1: '',
  address2: '',
  is_default: false,
};

export function AddressesPage() {
  const { token, isAuthenticated, user, refreshProfile } = useAuth();
  const { t } = useI18n();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadAddresses(currentToken: string) {
    try {
      const result = await api.addresses(currentToken);
      setAddresses(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to load addresses',
      );
    }
  }

  useEffect(() => {
    if (!token) {
      return;
    }

    // Remote address data is intentionally fetched on mount/update here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAddresses(token);
  }, [token]);

  if (user?.subject_type === 'ADMIN') {
    return <Navigate replace to="/admin" />;
  }

  if (!isAuthenticated || !token) {
    return <Navigate replace to="/login" />;
  }

  function resetForm() {
    setEditingAddressId(null);
    setForm(emptyForm);
  }

  function startEdit(address: Address) {
    setEditingAddressId(address.id);
    setForm({
      recipient_name: address.recipient_name,
      recipient_phone: address.recipient_phone,
      zip_code: address.zip_code,
      address1: address.address1,
      address2: address.address2 ?? '',
      is_default: address.is_default,
    });
    setNotice(null);
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentToken = token;
    if (!currentToken) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      if (editingAddressId) {
        await api.updateAddress(currentToken, editingAddressId, form);
        setNotice('Address updated');
      } else {
        await api.createAddress(currentToken, form);
        setNotice('Address created');
      }

      resetForm();
      await Promise.all([loadAddresses(currentToken), refreshProfile()]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to save address');
    }
  }

  async function handleDelete(addressId: string) {
    const currentToken = token;
    if (!currentToken) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      await api.deleteAddress(currentToken, addressId);
      setNotice('Address deleted');
      if (editingAddressId === addressId) {
        resetForm();
      }
      await Promise.all([loadAddresses(currentToken), refreshProfile()]);
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : 'Unable to delete address',
      );
    }
  }

  return (
    <section className="page">
      <header className="page-header">
        <div>
          <p className="eyebrow">{t('addr.eyebrow')}</p>
          <h2>{t('addr.title')}</h2>
        </div>
      </header>

      {notice ? <p className="callout success">{notice}</p> : null}
      {error ? <p className="callout error">{error}</p> : null}

      <div className="split-page">
        <form className="form-card" onSubmit={(event) => void handleSubmit(event)}>
          <div className="section-heading">
            <h3>{editingAddressId ? t('addr.edit') : t('addr.add')}</h3>
            {editingAddressId ? (
              <button className="ghost-button" onClick={resetForm} type="button">
                {t('addr.cancel')}
              </button>
            ) : null}
          </div>

          <div className="dual-grid">
            <label className="field-stack">
              <span className="field-label">{t('addr.recipient')}</span>
              <input
                className="text-input"
                value={form.recipient_name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, recipient_name: event.target.value }))
                }
                required
              />
            </label>
            <label className="field-stack">
              <span className="field-label">{t('addr.recipientPhone')}</span>
              <input
                className="text-input"
                value={form.recipient_phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, recipient_phone: event.target.value }))
                }
                required
              />
            </label>
          </div>

          <label className="field-stack">
            <span className="field-label">{t('addr.zip')}</span>
            <input
              className="text-input"
              value={form.zip_code}
              onChange={(event) =>
                setForm((current) => ({ ...current, zip_code: event.target.value }))
              }
              required
            />
          </label>

          <label className="field-stack">
            <span className="field-label">{t('addr.address1')}</span>
            <input
              className="text-input"
              value={form.address1}
              onChange={(event) =>
                setForm((current) => ({ ...current, address1: event.target.value }))
              }
              required
            />
          </label>

          <label className="field-stack">
            <span className="field-label">{t('addr.address2')}</span>
            <input
              className="text-input"
              value={form.address2}
              onChange={(event) =>
                setForm((current) => ({ ...current, address2: event.target.value }))
              }
            />
          </label>

          <label className="toggle-row">
            <input
              checked={form.is_default}
              onChange={(event) =>
                setForm((current) => ({ ...current, is_default: event.target.checked }))
              }
              type="checkbox"
            />
            <span>{t('addr.default')}</span>
          </label>

          <div className="form-actions">
            <button className="primary-button" type="submit">
              {editingAddressId ? t('addr.save') : t('addr.create')}
            </button>
            {editingAddressId ? (
              <button className="ghost-button" onClick={resetForm} type="button">
                {t('addr.cancel')}
              </button>
            ) : null}
          </div>
        </form>

        <div className="stack">
          {addresses.map((address) => (
            <article className="line-card" key={address.id}>
              <div className="section-heading">
                <div>
                  <h3>{address.recipient_name}</h3>
                  <p className="muted">{address.recipient_phone}</p>
                </div>
                {address.is_default ? <span className="pill">Default</span> : null}
              </div>
              <p className="muted">
                {address.zip_code} · {address.address1}
                {address.address2 ? `, ${address.address2}` : ''}
              </p>
              {address.updated_at ? <p className="muted">{formatDate(address.updated_at)}</p> : null}
              <div className="admin-actions">
                <button className="ghost-button" onClick={() => startEdit(address)} type="button">
                  {t('admin.editBtn')}
                </button>
                <button
                  className="ghost-button danger-button"
                  onClick={() => void handleDelete(address.id)}
                  type="button"
                >
                  {t('addr.delete')}
                </button>
              </div>
            </article>
          ))}

          {!addresses.length ? (
            <div className="empty-card">
              <p>{t('addr.none')}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
