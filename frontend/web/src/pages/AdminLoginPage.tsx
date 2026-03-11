import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function AdminLoginPage() {
  const { isAuthenticated, user, adminLogin } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  if (isAuthenticated && user?.subject_type === 'ADMIN') {
    return <Navigate replace to="/admin" />;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await adminLogin(form);
      navigate('/admin');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Admin login failed');
    }
  }

  return (
    <section className="page split-page">
      <div className="feature-panel">
        <p className="eyebrow">Admin Access</p>
        <h2>Separate back-office sign-in for internal operators.</h2>
        <p className="muted">
          Accounts created through public signup stay `USER`. Only `ADMIN` accounts can enter here.
        </p>
        <div className="feature-list">
          <div className="feature-item">
            <strong>Inventory control</strong>
            <span>Create, edit, and retire products without exposing internal tools.</span>
          </div>
          <div className="feature-item">
            <strong>Order operations</strong>
            <span>Confirm, ship, deliver, and monitor recent activity from one console.</span>
          </div>
          <div className="feature-item">
            <strong>Separated identity</strong>
            <span>Admin accounts live in a dedicated table and use a dedicated login route.</span>
          </div>
        </div>
        <div className="stack compact-stack">
          <Link className="ghost-button" to="/login">
            Go to customer login
          </Link>
        </div>
      </div>

      <form className="form-card" onSubmit={(event) => void handleSubmit(event)}>
        <h3>Admin sign in</h3>
        {error ? <p className="callout error">{error}</p> : null}

        <label className="field-stack">
          <span className="field-label">Email</span>
          <input
            className="text-input"
            type="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            required
          />
        </label>

        <label className="field-stack">
          <span className="field-label">Password</span>
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

        <button className="primary-button wide-button" type="submit">
          Enter admin
        </button>
      </form>
    </section>
  );
}
