import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { api } from '../lib/api';
import { useI18n } from '../i18n';

function linkClassName({ isActive }: { isActive: boolean }) {
  return `shell-link${isActive ? ' shell-link-active' : ''}`;
}

function NavIcon({ name }: { name: 'shop' | 'cart' | 'orders' | 'addresses' | 'dashboard' | 'login' }) {
  switch (name) {
    case 'shop':
      return (
        <svg className="shell-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 9.5h16l-1.2 11H5.2L4 9.5Zm2.4-4h11.2l1.4 4H5l1.4-4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'cart':
      return (
        <svg className="shell-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M6 7h15l-2 8H8L6 3H3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9 19.5a1.25 1.25 0 1 0 0 .01m8 0a1.25 1.25 0 1 0 0 .01"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'orders':
      return (
        <svg className="shell-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M7 4.5h10v15H7v-15Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M9 8h6M9 11.5h6M9 15h4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'addresses':
      return (
        <svg className="shell-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </svg>
      );
    case 'dashboard':
      return (
        <svg className="shell-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4.5 12a7.5 7.5 0 1 1 15 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M12 12l4-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M6 19.5h12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'login':
      return (
        <svg className="shell-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M10.5 7.5V6.8c0-1.3 1-2.3 2.3-2.3h4.7c1.3 0 2.3 1 2.3 2.3v10.4c0 1.3-1 2.3-2.3 2.3h-4.7c-1.3 0-2.3-1-2.3-2.3v-.7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 12h9m0 0-3-3m3 3-3 3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

export function AppShell() {
  const { user, logout, isAuthenticated } = useAuth();
  const { t, lang, setLang } = useI18n();

  return (
    <div className="shell">
      <aside className="shell-sidebar">
        <div className="shell-sidebar-inner">
          <div className="brand-block">
            <div className="brand-logo">
              <div className="brand-mark">HB</div>
              <div className="brand-logo-copy">
                <span className="brand-title">HB Market</span>
                <span className="brand-subtitle">
                  {user?.subject_type === 'ADMIN'
                    ? t('brand.subtitle.admin')
                    : t('brand.subtitle.storefront')}
                </span>
              </div>
            </div>
            <p className="muted brand-tagline">
              {user?.subject_type === 'ADMIN'
                ? t('brand.tagline.admin')
                : t('brand.tagline.storefront')}
            </p>
            <div className="brand-meta">
              <span className="meta-pill">
                {user?.subject_type === 'ADMIN' ? t('pill.backoffice') : t('pill.customer')}
              </span>
              <span className="meta-pill alt">{isAuthenticated ? t('pill.signedin') : t('pill.guest')}</span>
            </div>
          </div>

          <nav className="shell-nav">
            {user?.subject_type === 'ADMIN' ? (
              <>
                <p className="nav-section-label">{t('nav.admin')}</p>
                <NavLink className={linkClassName} to="/admin">
                  <span className="shell-link-content">
                    <NavIcon name="dashboard" />
                    <span className="shell-link-label">{t('nav.dashboard')}</span>
                  </span>
                </NavLink>
              </>
            ) : (
              <>
                <div className="nav-section">
                  <p className="nav-section-label">{t('nav.store')}</p>
                  <NavLink className={linkClassName} to="/">
                    <span className="shell-link-content">
                      <NavIcon name="shop" />
                      <span className="shell-link-label">{t('nav.shop')}</span>
                    </span>
                  </NavLink>
                  <NavLink className={linkClassName} to="/cart">
                    <span className="shell-link-content">
                      <NavIcon name="cart" />
                      <span className="shell-link-label">{t('nav.cart')}</span>
                    </span>
                  </NavLink>
                  <NavLink className={linkClassName} to="/orders">
                    <span className="shell-link-content">
                      <NavIcon name="orders" />
                      <span className="shell-link-label">{t('nav.orders')}</span>
                    </span>
                  </NavLink>
                </div>
                <div className="nav-section">
                  <p className="nav-section-label">{t('nav.account')}</p>
                  <NavLink className={linkClassName} to="/addresses">
                    <span className="shell-link-content">
                      <NavIcon name="addresses" />
                      <span className="shell-link-label">{t('nav.addresses')}</span>
                    </span>
                  </NavLink>
                  {!isAuthenticated ? (
                    <NavLink className={linkClassName} to="/login">
                      <span className="shell-link-content">
                        <NavIcon name="login" />
                        <span className="shell-link-label">{t('nav.signin')}</span>
                      </span>
                    </NavLink>
                  ) : null}
                </div>
              </>
            )}
          </nav>

          <div className="shell-sidebar-footer">
            <div className="status-card">
              <p className="status-label">{t('footer.environment')}</p>
              <strong>{api.baseUrl}</strong>
              <div className="status-meta">
                <span>{user ? `${user.name} · ${user.role}` : t('footer.noSession')}</span>
                <span>{user ? user.subject_type : t('footer.visitor')}</span>
              </div>
              {user ? (
                <button className="ghost-button ghost-button-quiet" onClick={logout} type="button">
                  {t('footer.signout')}
                </button>
              ) : null}
              <div className="lang-row">
                <label className="field-label" htmlFor="lang-select">
                  {t('lang.label')}
                </label>
                <select
                  id="lang-select"
                  className="text-input"
                  value={lang}
                  onChange={(event) => setLang(event.target.value as typeof lang)}
                >
                  <option value="ko">🇰🇷 한국어</option>
                  <option value="uz">🇺🇿 Oʻzbekcha</option>
                  <option value="ru">🇷🇺 Русский</option>
                  <option value="en">🇺🇸 English</option>
                </select>
              </div>
            </div>
            <p className="sidebar-footnote muted">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>
        </div>
      </aside>

      <main className="shell-main">
        <header className="shell-topbar" aria-label="Top bar">
          <div className="shell-topbar-title">HB Market</div>
        </header>
        <div className="shell-stage">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
