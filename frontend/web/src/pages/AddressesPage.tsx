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
  const { token, isAuthenticated, user, logout } = useAuth();
  const { t } = useI18n();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressAddressForm] = useState(emptyAddressForm);
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    current_password: '',
    new_password: '',
  });

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

  // --- Profile Logic ---
  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    try {
      setError(null);
      setNotice(null);
      const payload = {
        name: profileForm.name.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        current_password: profileForm.current_password || undefined,
        new_password: profileForm.new_password || undefined,
      };
      await api.updateProfile(token, payload);
      setNotice('Profile updated successfully. If you changed your email or password, please sign in again.');
      setProfileForm(prev => ({ ...prev, current_password: '', new_password: '' }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update profile');
    }
  }

  // --- Address Logic ---
  function startEditAddress(address: Address) {
    setEditingAddressId(address.id);
    setAddressAddressForm({
      recipient_name: address.recipient_name,
      recipient_phone: address.recipient_phone,
      zip_code: address.zip_code,
      address1: address.address1,
      address2: address.address2 || '',
      is_default: address.is_default,
    });
    setShowAddressForm(true);
    // Smooth scroll to the address form
    const element = document.getElementById('address-form-section');
    element?.scrollIntoView({ behavior: 'smooth' });
  }

  function cancelAddressEdit() {
    setEditingAddressId(null);
    setAddressAddressForm(emptyAddressForm);
    setShowAddressForm(false);
    setError(null);
  }

  async function handleAddressSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    try {
      setError(null);
      if (editingAddressId) {
        await api.updateAddress(token, editingAddressId, addressForm);
        setNotice('Address updated successfully');
      } else {
        await api.createAddress(token, addressForm);
        setNotice('Address added successfully');
      }
      cancelAddressEdit();
      await loadAddresses();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save address');
    }
  }

  async function handleAddressDelete(id: string) {
    if (!token || !window.confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.deleteAddress(token, id);
      setNotice('Address deleted');
      await loadAddresses();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Cannot delete address linked to orders');
    }
  }

  async function setAddressAsDefault(id: string) {
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
          <p className="product-kicker">{t('pill.customer') || 'Account'}</p>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800 }}>{t('nav.account') || 'My Profile'}</h2>
        </div>
        <button className="ghost-button danger-button" onClick={logout}>{t('footer.signout')}</button>
      </header>

      {notice && <p className="callout success">{notice}</p>}
      {error && <p className="callout error">{error}</p>}

      {/* --- Profile Section --- */}
      <article className="form-card" style={{ marginBottom: '48px', padding: '32px' }}>
        <h3 style={{ marginBottom: '24px' }}>{t('user.profile.settings')}</h3>
        <form onSubmit={(e) => void handleUpdateProfile(e)}>
          <div className="dual-grid" style={{ marginBottom: '20px' }}>
            <label className="field-stack">
              <span className="field-label">{t('login.name')}</span>
              <input 
                className="text-input" 
                value={profileForm.name} 
                onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                required
              />
            </label>
            <label className="field-stack">
              <span className="field-label">{t('login.phone')}</span>
              <input 
                className="text-input" 
                value={profileForm.phone} 
                onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
              />
            </label>
          </div>
          <div className="dual-grid" style={{ marginBottom: '20px' }}>
            <label className="field-stack">
              <span className="field-label">{t('login.email')}</span>
              <input 
                className="text-input" 
                type="email"
                value={profileForm.email} 
                onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </label>
          </div>
          
          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '24px', borderRadius: '12px', marginTop: '32px' }}>
            <h4 style={{ marginBottom: '16px' }}>{t('user.profile.changePassword')}</h4>
            <div className="dual-grid" style={{ marginBottom: '16px' }}>
              <label className="field-stack">
                <span className="field-label">{t('user.profile.currentPassword')}</span>
                <input 
                  className="text-input" 
                  type="password"
                  value={profileForm.current_password} 
                  onChange={e => setProfileForm(p => ({ ...p, current_password: e.target.value }))} 
                  placeholder={t('user.profile.passwordRequired')}
                />
              </label>
              <label className="field-stack">
                <span className="field-label">{t('user.profile.newPassword')}</span>
                <input 
                  className="text-input" 
                  type="password"
                  value={profileForm.new_password} 
                  onChange={e => setProfileForm(p => ({ ...p, new_password: e.target.value }))} 
                  placeholder="Min 8 characters"
                />
              </label>
            </div>
          </div>

          <div style={{ marginTop: '32px' }}>
            <button className="primary-button" type="submit">{t('user.profile.update')}</button>
          </div>
        </form>
      </article>

      <hr style={{ margin: '64px 0', border: 'none', borderTop: '1px solid rgba(0,0,0,0.05)' }} />

      {/* --- Address Section --- */}
      <div id="address-section" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{t('nav.addresses')}</h3>
        <button 
          className="ghost-button" 
          onClick={() => { if(showAddressForm) cancelAddressEdit(); else setShowAddressForm(true); }}
        >
          {showAddressForm ? t('addr.cancel') : `+ ${t('addr.add')}`}
        </button>
      </div>

      {showAddressForm && (
        <article id="address-form-section" className="form-card" style={{ marginBottom: '48px', padding: '32px', border: '1px solid var(--primary-color)' }}>
          <h3>{editingAddressId ? t('addr.edit') : t('addr.add')}</h3>
          <form onSubmit={(e) => void handleAddressSubmit(e)} style={{ marginTop: '24px' }}>
            <div className="dual-grid" style={{ marginBottom: '20px' }}>
              <label className="field-stack">
                <span className="field-label">{t('addr.recipient')}</span>
                <input 
                  className="text-input" 
                  value={addressForm.recipient_name} 
                  onChange={e => setAddressAddressForm(f => ({ ...f, recipient_name: e.target.value }))}
                  required
                />
              </label>
              <label className="field-stack">
                <span className="field-label">{t('addr.recipientPhone')}</span>
                <input 
                  className="text-input" 
                  value={addressForm.recipient_phone} 
                  onChange={e => setAddressAddressForm(f => ({ ...f, recipient_phone: e.target.value }))}
                  required
                />
              </label>
            </div>

            <div className="triple-grid" style={{ marginBottom: '20px', gridTemplateColumns: '1fr 2fr 2fr' }}>
              <label className="field-stack">
                <span className="field-label">{t('addr.zip')}</span>
                <input 
                  className="text-input" 
                  value={addressForm.zip_code} 
                  onChange={e => setAddressAddressForm(f => ({ ...f, zip_code: e.target.value }))}
                  required
                />
              </label>
              <label className="field-stack">
                <span className="field-label">{t('addr.address1')}</span>
                <input 
                  className="text-input" 
                  value={addressForm.address1} 
                  onChange={e => setAddressAddressForm(f => ({ ...f, address1: e.target.value }))}
                  required
                />
              </label>
              <label className="field-stack">
                <span className="field-label">{t('addr.address2')}</span>
                <input 
                  className="text-input" 
                  value={addressForm.address2} 
                  onChange={e => setAddressAddressForm(f => ({ ...f, address2: e.target.value }))}
                />
              </label>
            </div>

            <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <input 
                type="checkbox" 
                id="is_default"
                checked={addressForm.is_default} 
                onChange={e => setAddressAddressForm(f => ({ ...f, is_default: e.target.checked }))}
                style={{ width: '20px', height: '20px' }}
              />
              <label htmlFor="is_default" style={{ fontWeight: 600, cursor: 'pointer' }}>{t('addr.default')}</label>
            </div>

            <div className="form-actions">
              <button className="primary-button" type="submit">
                {editingAddressId ? t('addr.save') : t('addr.create')}
              </button>
              <button className="ghost-button" type="button" onClick={cancelAddressEdit}>{t('addr.cancel')}</button>
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
              <button className="ghost-button" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => startEditAddress(addr)}>{t('addr.edit')}</button>
              {!addr.is_default && (
                <button className="ghost-button" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => void setAddressAsDefault(addr.id)}>{t('addr.default')}</button>
              )}
              <button className="ghost-button danger-button" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={() => void handleAddressDelete(addr.id)}>{t('addr.delete')}</button>
            </div>
          </article>
        ))}

        {addresses.length === 0 && !showAddressForm && (
          <div className="empty-card" style={{ gridColumn: '1 / -1', padding: '64px', textAlign: 'center' }}>
            <p className="muted">{t('addr.none')}</p>
          </div>
        )}
      </div>
    </section>
  );
}
