import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError, setToken } from '../store/authSlice';
import { useNavigate, Link } from 'react-router-dom';
import { Shield } from 'lucide-react';
import api from '../api/client';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [twoFaCode, setTwoFaCode] = useState('');
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { status, error, is2FARequired, tempToken, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(clearError());
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [dispatch, isAuthenticated, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser({ email, password }));
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/login/2fa', {
        temp_token: tempToken,
        code: twoFaCode
      });
      // Complete login locally
      dispatch(setToken(response.data.access_token));
      navigate('/dashboard');
    } catch (err) {
      alert(err.response?.data?.detail || "Invalid 2FA code");
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Shield color="var(--accent-primary)" size={32} />
          <h2 style={{ margin: 0 }}>SecureVault</h2>
        </div>
        
        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-destructive)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-destructive)' }}>
            {error}
          </div>
        )}

        {!is2FARequired ? (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            <label style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
            
            <label style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>Password</label>
            <input 
              type="password" 
              className="input-field" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
            
            <button type="submit" className="btn btn-primary" disabled={status === 'loading'} style={{ marginTop: '0.5rem' }}>
              {status === 'loading' ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handle2FASubmit} style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ marginBottom: '1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Two-Factor Authentication is enabled on this account.
            </div>
            <label style={{ marginBottom: '0.5rem', fontSize: '0.875rem' }}>6-Digit Code</label>
            <input 
              type="text" 
              className="input-field mono-text" 
              placeholder="000000"
              maxLength={6}
              value={twoFaCode} 
              onChange={(e) => setTwoFaCode(e.target.value)} 
              required 
              style={{ letterSpacing: '0.25rem', textAlign: 'center', fontSize: '1.25rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Verify & Login
            </button>
          </form>
        )}

        {!is2FARequired && (
          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Don't have an account? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Register</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
