import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/api';
import { useI18n } from '../i18n';
import type { Address } from '../types';

const emptyAddressForm = {
  recipient_name: '',
  recipient_phone: '',
  zip_code: '',
  address1: '',
  address2: '',
  is_default: false,
};

export function AddressesPage() {
  const { token, isAuthenticated, user } = useAuth();
  const { t } = useI18n();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowProfileManager] = useState(false);
  const [form, setForm] = useState(emptyAddressForm);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    loadAddresses();
  }, [token]);

  async function loadAddresses() {
    if (!token) return;
    try {
      const result = await api.addresses(token);
      setAddresses(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load addresses');
    }
  }

  if (user?.subject_type === 'ADMIN') {
    return <Navigate replace to="/admin" />;
  }

  if (!isAuthenticated || !token) {
    return <Navigate replace to="/login" />;
  }

  function startEdit(address: Address) {
    setEditingId(address.id);
    setForm({
      recipient_name: address.recipient_name,
      recipient_phone: address.recipient_phone,
      zip_code: address.zip_code,
      address1: address.address1,
      address2: address.address2 || '',
      is_default: address.is_default,
    });
    setShowProfileManager(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyAddressForm);
    setShowProfileManager(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    try {
      setError(null);
      if (editingId) {
        await api.updateAddress(token, editingId, form);
        setNotice('Address updated successfully');
      } else {
        await api.createAddress(token, form);
        setNotice('Address added successfully');
      }
      cancelEdit();
      await loadAddresses();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save address');
    }
  }

  async function handleDelete(id: string) {
    if (!token || !window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.deleteAddress(token, id);
      setNotice('Address deleted');
      await loadAddresses();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cannot delete address linked to orders');
    }
  }

  async function setAsDefault(id: string) {
    if (!token) return;
    try {
      await api.updateAddress(token, id, { is_default: true });
      await loadAddresses();
      setNotice('Default address updated');
    } catch (e) {
      setError('Failed to set default address');
    }
  }

  return (
    <section className="page addresses-page">
      <header className="page-header" style={{ background: 'transparent', border: 'none', boxShadow: 'none', paddingLeft: 0, marginBottom: '32px' }}>
        <div className="page-title-block">
          <p className="product-kicker">{t('address.eyebrow') || 'Shipping'}</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{t('nav.addresses')}</h2>
        </div>
        <button 
          className="primary-button" 
          onClick={() => { if(showForm) cancelEdit(); else setShowProfileManager(true); }}
        >
          {showForm ? 'Cancel' : '+ Add New Address'}
        </button>
      </header>

      {notice && <p className="callout success">{notice}</p>}
      {error && <p className="callout error">{error}</p>}

      {showForm && (
        <article className="form-card" style={{ marginBottom: '48px', padding: '32px' }}>
          <h3>{editingId ? 'Edit Address' : 'New Delivery Address'}</h3>
          <form onSubmit={(e) => void handleSubmit(e)} style={{ marginTop: '24px' }}>
            <div className="dual-grid" style={{ marginBottom: '20px' }}>
              <label className="field-stack">
                <span className="field-label">Recipient Name</span>
                <input 
                  className="text-input" 
                  value={form.recipient_name} 
                  onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))}
                  required
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Phone Number</span>
                <input 
                  className="text-input" 
                  value={form.recipient_phone} 
                  onChange={e => setForm(f => ({ ...f, recipient_phone: e.target.value }))}
                  required
                />
              </label>
            </div>

            <div className="triple-grid" style={{ marginBottom: '20px', gridTemplateColumns: '1fr 2fr 2fr' }}>
              <label className="field-stack">
                <span className="field-label">Zip Code</span>
                <input 
                  className="text-input" 
                  value={form.zip_code} 
                  onChange={e => setForm(f => ({ ...f, zip_code: e.target.value }))}
                  required
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Address Line 1</span>
                <input 
                  className="text-input" 
                  value={form.address1} 
                  onChange={e => setForm(f => ({ ...f, address1: e.target.value }))}
                  required
                />
              </label>
              <label className="field-stack">
                <span className="field-label">Address Line 2 (Optional)</span>
                <input 
                  className="text-input" 
                  value={form.address2} 
                  onChange={e => setForm(f => ({ ...f, address2: e.target.value }))}
                />
              </label>
            </div>

            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input 
                type="checkbox" 
                id="is_default"
                checked={form.is_default} 
                onChange={e => setForm(f => ({ ...f, is_default: e.target.checked }))}
                style={{ width: '20px', height: '20px' }}
              />
              <label htmlFor="is_default" style={{ fontWeight: 600, cursor: 'pointer' }}>Set as default shipping address</label>
            </div>

            <div className="form-actions">
              <button className="primary-button" type="submit">
                {editingId ? 'Update Address' : 'Save Address'}
              </button>
              <button className="ghost-button" type="button" onClick={cancelEdit}>Cancel</button>
            </div>
          </form>
        </article>
      )}

      <div className="address-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px' }}>
        {addresses.map(addr => (
          <article 
            key={addr.id} 
            className="line-card address-card" 
            style={{ 
              padding: '24px', 
              position: 'relative',
              border: addr.is_default ? '2px solid var(--primary-color)' : '1px solid rgba(0,0,0,0.05)',
              background: addr.is_default ? 'rgba(255, 107, 53, 0.02)' : 'white'
            }}
          >
            {addr.is_default && (
              <span className="pill" style={{ position: 'absolute', top: '24px', right: '24px' }}>DEFAULT</span>
            )}
            
            <div className="address-content">
              <strong style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px' }}>{addr.recipient_name}</strong>
              <p className="muted" style={{ fontWeight: 600, marginBottom: '16px' }}>{addr.recipient_phone}</p>
              
              <div style={{ minHeight: '60px' }}>
                <p>{addr.address1}</p>
                {addr.address2 && <p>{addr.address2}</p>}
                <p className="muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>{addr.zip_code}</p>
              </div>
            </div>

            <div className="admin-actions" style={{ marginTop: '24px', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: '20px' }}>
              <button className="ghost-button" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => startEdit(addr)}>Edit</button>
              {!addr.is_default && (
                <button className="ghost-button" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => void setAsDefault(addr.id)}>Set Default</button>
              )}
              <button className="ghost-button danger-button" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => void handleDelete(addr.id)}>Delete</button>
            </div>
          </article>
        ))}

        {addresses.length === 0 && !showForm && (
          <div className="empty-card" style={{ gridColumn: '1 / -1', padding: '64px', textAlign: 'center' }}>
            <p className="muted">No saved addresses. Add one to speed up your checkout!</p>
          </div>
        )}
      </div>
    </section>
  );
}
