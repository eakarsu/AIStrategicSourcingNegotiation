import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export default function Login({ onLogin }) {
  const [demoAvailable, setDemoAvailable] = useState(false);
  const [demoChecked, setDemoChecked] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    axios.get(`${API}/api/auth/demo-status`).then(({ data }) => { if (active) setDemoAvailable(!!data.available); })
      .catch(() => { if (active) setDemoAvailable(false); })
      .finally(() => { if (active) setDemoChecked(true); });
    return () => { active = false; };
  }, []);

  const handleDemoLogin = async () => {
    if (!demoAvailable || loading) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/demo-login`);
      toast.success('Welcome back!');
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Demo login unavailable');
    } finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/login`, { email, password });
      toast.success('Welcome back!');
      onLogin(res.data.token, res.data.user);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">SS</div>
          <h1>AI Strategic Sourcing</h1>
          <p>Procurement Intelligence Platform</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading || !demoAvailable}
            aria-label="Log In as Demo"
            style={{ width: '100%', marginBottom: '12px', padding: '10px 14px', borderRadius: '8px', border: '1px solid currentColor', background: 'transparent', cursor: 'pointer' }}
          >
            Log In as Demo
          </button>
          {demoChecked && !demoAvailable && <p className="ai-muted" role="status">Demo login is unavailable. Configure the local demo account and enable demo login on the server.</p>}
          <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
