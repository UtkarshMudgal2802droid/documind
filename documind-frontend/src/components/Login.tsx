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
    } catch {
      setStatus('error');
      setErrorMsg('Invalid credentials. Please check your username and password.');
    }
  };

  return (
    <div className="login-wrapper">
      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      >
        <motion.div
          className="login-logo"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
        >
          DM
        </motion.div>

        <h1 className="login-title">Welcome back</h1>
        <p className="login-subtitle">Sign in to {import.meta.env.VITE_PROJECT_NAME || 'the'} AI platform</p>

        <form className="login-form" onSubmit={handleLogin} noValidate>
          <div className="input-group">
            <label className="input-label" htmlFor="login-username">Username</label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                id="login-username"
                className={`input ${usernameError ? 'input-error' : ''}`}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                placeholder="Enter your username"
                autoComplete="username"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            {usernameError && (
              <div className="input-error-msg">
                <AlertCircle size={12} />
                {usernameError}
              </div>
            )}
          </div>

          <div className="input-group">
            <label className="input-label" htmlFor="login-password">Password</label>
            <div className="input-password">
              <Lock size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 1 }} />
              <input
                id="login-password"
                className={`input ${passwordError ? 'input-error' : ''}`}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                placeholder="Enter your password"
                autoComplete="current-password"
                style={{ paddingLeft: '2.25rem' }}
              />
              <button
                type="button"
                className="input-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {passwordError && (
              <div className="input-error-msg">
                <AlertCircle size={12} />
                {passwordError}
              </div>
            )}
          </div>

          <motion.button
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={status === 'loading'}
            whileTap={{ scale: 0.98 }}
            style={{ marginTop: '0.25rem' }}
          >
            {status === 'loading' ? (
              <>
                <span className="spinner" />
                Signing in...
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                Sign In
              </>
            )}
          </motion.button>

          {status === 'error' && (
            <motion.div
              className="status-msg status-msg--error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AlertCircle size={14} />
              {errorMsg}
            </motion.div>
          )}
        </form>
      </motion.div>
    </div>
  );
};