import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';
import { documentService } from '../services/api';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [touched, setTouched] = useState({ username: false, password: false });

  const usernameError = touched.username && !username.trim() ? 'Username is required' : '';
  const passwordError = touched.password && !password.trim() ? 'Password is required' : '';
  const isFormValid = username.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });

    if (!isFormValid) return;

    try {
      setStatus('loading');
      setErrorMsg('');
      await documentService.login(username.trim(), password);
      setStatus('idle');
      onLoginSuccess();
    } catch (err: any) {
      setStatus('error');
      const msg = err.response?.data?.detail || err.message || 'Unknown error';
      setErrorMsg(`Failed: ${msg}`);
    }
  };

  return (
    <div className="login-wrapper" style={{ display: 'flex', minHeight: '100vh', padding: 0, backgroundColor: '#ffffff' }}>
      
      {/* Left side: The Form */}
      <div style={{ flex: '1 1 50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <motion.div
          style={{ width: '100%', maxWidth: '400px' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div style={{ width: '32px', height: '32px', backgroundColor: '#000000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.7rem' }}>
              DM
            </div>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, letterSpacing: '-0.5px', color: '#111827' }}>
              DocuMind.ai
            </span>
          </div>

          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-1px', color: '#111827', marginBottom: '0.5rem' }}>
            Log in to your account
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
            Welcome back! Please enter your details.
          </p>

          <form className="login-form" onSubmit={handleLogin} noValidate>
            <div className="input-group">
              <label className="input-label" htmlFor="login-username" style={{ fontWeight: 600, color: '#374151' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  id="login-username"
                  className={`input ${usernameError ? 'input-error' : ''}`}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                  placeholder="Enter your username"
                  autoComplete="username"
                  style={{ paddingLeft: '2.25rem', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                />
              </div>
              {usernameError && (
                <div className="input-error-msg" style={{ color: '#dc2626' }}>
                  <AlertCircle size={12} />
                  {usernameError}
                </div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="login-password" style={{ fontWeight: 600, color: '#374151' }}>Password</label>
              <div className="input-password">
                <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 1 }} />
                <input
                  id="login-password"
                  className={`input ${passwordError ? 'input-error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{ paddingLeft: '2.25rem', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                />
                <button
                  type="button"
                  className="input-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ color: '#6b7280' }}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {passwordError && (
                <div className="input-error-msg" style={{ color: '#dc2626' }}>
                  <AlertCircle size={12} />
                  {passwordError}
                </div>
              )}
            </div>

            <motion.button
              type="submit"
              className="btn btn-full btn-lg"
              disabled={status === 'loading'}
              whileTap={{ scale: 0.98 }}
              style={{ marginTop: '1rem', backgroundColor: '#000000', color: '#ffffff', borderRadius: '8px', fontWeight: 600 }}
            >
              {status === 'loading' ? (
                <>
                  <span className="spinner" style={{ borderTopColor: '#ffffff' }} />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>

            {status === 'error' && (
              <motion.div
                className="status-msg status-msg--error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', marginTop: '1rem' }}
              >
                <AlertCircle size={14} />
                {errorMsg.replace('Failed: ', '')}
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>

      {/* Right side: The Branding Splash */}
      <div style={{ flex: '1 1 50%', backgroundColor: '#0a0a0a', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '4rem' }} className="login-splash-pane">
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.08) 0%, transparent 50%)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 40%)' }} />
        
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ position: 'relative', zIndex: 10, maxWidth: '500px', margin: '0 auto' }}
        >
          <div style={{ color: '#a3a3a3', fontWeight: 600, letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.8rem', marginBottom: '1.5rem' }}>Enterprise AI</div>
          <h2 style={{ color: '#ffffff', fontSize: '3rem', fontWeight: 700, lineHeight: 1.1, letterSpacing: '-1px', marginBottom: '1.5rem' }}>
            Transform documents into intelligent answers.
          </h2>
          <p style={{ color: '#737373', fontSize: '1.1rem', lineHeight: 1.6 }}>
            The fastest, most secure way to extract knowledge from your organization's unstructured data using state-of-the-art vector search.
          </p>
        </motion.div>
      </div>
    </div>
  );
};