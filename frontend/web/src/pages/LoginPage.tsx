import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n';

type Mode = 'login' | 'signup';

export function LoginPage() {
  const { isAuthenticated, user, login, signUp } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('login');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    recipient_name: '',
    recipient_phone: '',
    zip_code: '',
    address1: '',
    address2: '',
  });

  if (isAuthenticated) {
    if (user?.subject_type === 'ADMIN') {
      return <Navigate replace to="/admin" />;
    }
    return <Navigate replace to="/" />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
        navigate('/');
        return;
      }

      await signUp({
        email: form.email,
        password: form.password,
        name: form.name,
        phone: form.phone || undefined,
        addresses: form.address1
          ? [
              {
                recipient_name: form.recipient_name || form.name,
                recipient_phone: form.recipient_phone || form.phone,
                zip_code: form.zip_code,
                address1: form.address1,
                address2: form.address2 || undefined,
                is_default: true,
              },
            ]
          : undefined,
      });
      setMessage('Account created. You are now signed in.');
      navigate('/');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Request failed');
    }
  }

  return (
    <section className="page split-page">
      <div className="feature-panel">
        <p className="eyebrow">Access</p>
        <h2>{t('login.title')}</h2>
        <p className="muted">{t('login.subtitle')}</p>
        <div className="feature-list">
          <div className="feature-item">
            <strong>{t('login.customerLogin')}</strong>
            <span>{t('login.customerLoginDesc')}</span>
          </div>
          <div className="feature-item">
            <strong>{t('login.customerSignup')}</strong>
            <span>{t('login.customerSignupDesc')}</span>
          </div>
          <div className="feature-item">
            <strong>{t('login.adminSeparate')}</strong>
            <span>{t('login.adminSeparateDesc')}</span>
          </div>
        </div>
        <div className="stack compact-stack">
          <Link className="ghost-button" to="/admin/login">
            {t('login.adminSignIn')}
          </Link>
        </div>
        <div className="mode-switch">
          <button
            className={mode === 'login' ? 'primary-button' : 'ghost-button'}
            onClick={() => setMode('login')}
            type="button"
          >
            {t('login.mode.login')}
          </button>
          <button
            className={mode === 'signup' ? 'primary-button' : 'ghost-button'}
            onClick={() => setMode('signup')}
            type="button"
          >
            {t('login.mode.signup')}
          </button>
        </div>
      </div>

      <form className="form-card" onSubmit={(event) => void handleSubmit(event)}>
        <h3>{mode === 'login' ? t('login.form.welcome') : t('login.form.create')}</h3>
        {message ? <p className="callout success">{message}</p> : null}
        {error ? <p className="callout error">{error}</p> : null}

        <label className="field-stack">
          <span className="field-label">{t('login.email')}</span>
          <input
            className="text-input"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </label>

        <label className="field-stack">
          <span className="field-label">{t('login.password')}</span>
          <input
            className="text-input"
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((current) => ({ ...current, password: event.target.value }))
            }
            required
          />
        </label>

        {mode === 'signup' ? (
          <>
            <label className="field-stack">
              <span className="field-label">{t('login.name')}</span>
              <input
                className="text-input"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </label>

            <label className="field-stack">
              <span className="field-label">{t('login.phone')}</span>
              <input
                className="text-input"
                value={form.phone}
                onChange={(event) =>
                  setForm((current) => ({ ...current, phone: event.target.value }))
                }
              />
            </label>

            <div className="subsection">
              <p className="subsection-title">{t('login.defaultAddress')}</p>
              <label className="field-stack">
                <span className="field-label">{t('login.recipient')}</span>
                <input
                  className="text-input"
                  value={form.recipient_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      recipient_name: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="field-stack">
                <span className="field-label">{t('login.recipientPhone')}</span>
                <input
                  className="text-input"
                  value={form.recipient_phone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      recipient_phone: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="field-stack">
                <span className="field-label">{t('login.zip')}</span>
                <input
                  className="text-input"
                  value={form.zip_code}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, zip_code: event.target.value }))
                  }
                />
              </label>
              <label className="field-stack">
                <span className="field-label">{t('login.address1')}</span>
                <input
                  className="text-input"
                  value={form.address1}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, address1: event.target.value }))
                  }
                />
              </label>
              <label className="field-stack">
                <span className="field-label">{t('login.address2')}</span>
                <input
                  className="text-input"
                  value={form.address2}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, address2: event.target.value }))
                  }
                />
              </label>
            </div>
          </>
        ) : null}

        <button className="primary-button wide-button" type="submit">
          {mode === 'login' ? t('login.submit.login') : t('login.submit.signup')}
        </button>
      </form>
    </section>
  );
}
