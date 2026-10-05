import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Sparkles, Shield, Zap, XCircle, CheckCircle } from 'lucide-react';
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
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'loading'>('idle');
  const [logoutAllUsername, setLogoutAllUsername] = useState('');
  const [logoutAllPassword, setLogoutAllPassword] = useState('');
  const [logoutAllStatus, setLogoutAllStatus] = useState<'idle' | 'loading'>('idle');
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
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
        onLoginSuccess();
      }, 2000);
    } catch (err: any) {
      setStatus('error');
      const detail = err.response?.data?.detail || err.message || 'Something went wrong. Please try again.';
      setErrorMsg(detail);
      setShowErrorModal(true);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotUsername.trim() || !newPassword.trim() || !confirmPassword.trim()) {
       setErrorMsg('All fields are required.');
       setShowErrorModal(true);
       return;
    }

    try {
      setForgotStatus('loading');
      await documentService.forgotPassword(forgotUsername.trim(), newPassword, confirmPassword);
      setForgotStatus('idle');
      setShowForgotModal(false);
      setForgotUsername('');
      setNewPassword('');
      setConfirmPassword('');
      alert("Password reset successfully! You can now log in.");
    } catch (err: any) {
      setForgotStatus('idle');
      const detail = err.response?.data?.detail || err.message || 'Failed to reset password. Please try again.';
      setErrorMsg(detail);
      setShowErrorModal(true);
    }
  };

  const handleLogoutAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoutAllUsername.trim() || !logoutAllPassword.trim()) {
       setErrorMsg('Username and password are required to confirm logout.');
       setShowErrorModal(true);
       return;
    }

    try {
      setLogoutAllStatus('loading');
      await documentService.logoutAllDevices(logoutAllUsername.trim(), logoutAllPassword);
      setLogoutAllStatus('idle');
      setShowLogoutAllModal(false);
      setLogoutAllUsername('');
      setLogoutAllPassword('');
      alert("Success! You have been securely logged out from all devices globally.");
    } catch (err: any) {
      setLogoutAllStatus('idle');
      const detail = err.response?.data?.detail || err.message || 'Failed to logout. Please check credentials.';
      setErrorMsg(detail);
      setShowErrorModal(true);
    }
  };

  return (
    <div className="login-wrapper" style={{ display: 'flex', minHeight: '100vh', padding: 0, background: '#f8f9fc' }}>

      {/* Left side: Login Form */}
      <div style={{
        flex: '1 1 50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem', background: '#ffffff',
      }}>
        <motion.div
          style={{ width: '100%', maxWidth: '400px' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        >
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.5rem' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: '0.75rem', letterSpacing: '-0.5px',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            }}>
              DM
            </div>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.5px', color: '#1e1b4b' }}>
              DocuMind<span style={{ color: '#6366f1' }}>.ai</span>
            </span>
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-1px', color: '#1e1b4b', marginBottom: '0.5rem', lineHeight: 1.2 }}>
            Welcome back
          </h1>
          <p style={{ color: '#64748b', marginBottom: '2rem', fontSize: '0.95rem', lineHeight: 1.5 }}>
            Sign in to your DocuMind workspace to continue.
          </p>

          <form className="login-form" onSubmit={handleLogin} noValidate>
            {/* Username */}
            <div className="input-group">
              <label className="input-label" htmlFor="login-username" style={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  id="login-username"
                  className={`input ${usernameError ? 'input-error' : ''}`}
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                  placeholder="Enter your username"
                  autoComplete="username"
                  style={{
                    paddingLeft: '2.5rem', backgroundColor: '#f8f9fc', border: '1.5px solid #e2e5f0',
                    borderRadius: '10px', fontSize: '0.9rem', padding: '0.8rem 1rem 0.8rem 2.5rem',
                    transition: 'all 0.2s ease', color: '#1e1b4b',
                  }}
                />
              </div>
              {usernameError && (
                <div className="input-error-msg" style={{ color: '#dc2626', marginTop: '0.35rem', fontSize: '0.75rem' }}>
                  <AlertCircle size={12} />
                  {usernameError}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label className="input-label" htmlFor="login-password" style={{ fontWeight: 600, color: '#334155', fontSize: '0.8rem' }}>Password</label>
                <button type="button" onClick={() => setShowForgotModal(true)} style={{ background: 'none', border: 'none', color: '#6366f1', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: 0 }}>Forgot Password?</button>
              </div>
              <div className="input-password">
                <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', zIndex: 1 }} />
                <input
                  id="login-password"
                  className={`input ${passwordError ? 'input-error' : ''}`}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  style={{
                    paddingLeft: '2.5rem', backgroundColor: '#f8f9fc', border: '1.5px solid #e2e5f0',
                    borderRadius: '10px', fontSize: '0.9rem', padding: '0.8rem 2.5rem 0.8rem 2.5rem',
                    transition: 'all 0.2s ease', color: '#1e1b4b',
                  }}
                />
                <button
                  type="button"
                  className="input-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{ color: '#94a3b8' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordError && (
                <div className="input-error-msg" style={{ color: '#dc2626', marginTop: '0.35rem', fontSize: '0.75rem' }}>
                  <AlertCircle size={12} />
                  {passwordError}
                </div>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              className="btn btn-full btn-lg"
              disabled={status === 'loading'}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              style={{
                marginTop: '0.75rem',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#ffffff', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                border: 'none', cursor: 'pointer', padding: '0.85rem 1.5rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
              }}
            >
              {status === 'loading' ? (
                <>
                  <span className="spinner" style={{ borderTopColor: '#ffffff' }} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>


          </form>

          {/* Footer */}
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
              Secured by enterprise-grade encryption
            </p>
            <button 
              type="button" 
              onClick={() => setShowLogoutAllModal(true)}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Sign out from all devices globally
            </button>
          </div>>
        </motion.div>
      </div>

      {/* Right side: Premium Gradient Splash */}
      <div
        className="login-splash-pane"
        style={{
          flex: '1 1 50%',
          background: 'linear-gradient(145deg, #312e81 0%, #4338ca 25%, #6366f1 55%, #818cf8 100%)',
          position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          padding: '4rem',
        }}
      >
        {/* Decorative orbs */}
        <div style={{
          position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 65%)',
          top: '-100px', right: '-100px',
        }} />
        <div style={{
          position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)',
          bottom: '-50px', left: '-50px',
        }} />
        <div style={{
          position: 'absolute', width: '200px', height: '200px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.3) 0%, transparent 60%)',
          top: '40%', left: '30%',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          style={{ position: 'relative', zIndex: 10, maxWidth: '480px' }}
        >
          <div style={{
            color: 'rgba(255,255,255,0.7)', fontWeight: 600, letterSpacing: '2.5px',
            textTransform: 'uppercase', fontSize: '0.72rem', marginBottom: '1.5rem',
          }}>
            Enterprise AI Platform
          </div>
          <h2 style={{
            color: '#ffffff', fontSize: '2.8rem', fontWeight: 800, lineHeight: 1.1,
            letterSpacing: '-1.5px', marginBottom: '1.5rem',
          }}>
            Transform documents into intelligent answers.
          </h2>
          <p style={{
            color: 'rgba(255,255,255,0.75)', fontSize: '1.05rem', lineHeight: 1.7,
            marginBottom: '2.5rem',
          }}>
            The fastest, most secure way to extract knowledge from your organization's unstructured data using state-of-the-art vector search.
          </p>

          {/* Feature pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
            {[
              { icon: <Sparkles size={13} />, label: 'AI-Powered Search' },
              { icon: <Shield size={13} />, label: 'Enterprise Security' },
              { icon: <Zap size={13} />, label: 'Real-time Processing' },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  padding: '0.4rem 0.85rem', borderRadius: '100px',
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#ffffff', fontSize: '0.75rem', fontWeight: 500,
                  backdropFilter: 'blur(8px)',
                }}
              >
                {item.icon}
                {item.label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Error Modal Popup */}
      <AnimatePresence>
        {showErrorModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: '1rem',
            }}
            onClick={() => setShowErrorModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff', borderRadius: '16px', padding: '2rem 2rem 1.75rem',
                maxWidth: '340px', width: '100%', textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.06)',
              }}
            >
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <XCircle size={28} color="#dc2626" />
              </div>

              <p style={{
                fontSize: '0.95rem', color: '#1e1b4b', lineHeight: 1.5,
                marginBottom: '1.5rem', fontWeight: 500,
              }}>
                {errorMsg}
              </p>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowErrorModal(false)}
                style={{
                  width: '100%', padding: '0.7rem 1.5rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                  color: '#ffffff', border: 'none', borderRadius: '10px',
                  fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)',
                }}
              >
                OK
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal Popup */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: '1rem',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              style={{
                background: '#ffffff', borderRadius: '16px', padding: '2rem 2rem 1.75rem',
                maxWidth: '340px', width: '100%', textAlign: 'center',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.06)',
              }}
            >
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1rem',
              }}>
                <CheckCircle size={28} color="#059669" />
              </div>

              <p style={{
                fontSize: '1.05rem', color: '#1e1b4b', lineHeight: 1.5,
                fontWeight: 600, marginBottom: '0.3rem',
              }}>
                Welcome, {username}!
              </p>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Signing you in...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Forgot Password Modal Popup */}
      <AnimatePresence>
        {showForgotModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: '1rem', backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowForgotModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff', borderRadius: '16px', padding: '2rem',
                maxWidth: '380px', width: '100%',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.06)',
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e1b4b', fontSize: '1.2rem' }}>Reset Password</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Enter your username and new password to instantly reset it.</p>
              
              <form onSubmit={handleResetPassword}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#334155', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Username</label>
                  <input
                    type="text"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    placeholder="Enter your username"
                    style={{
                      width: '100%', padding: '0.75rem', backgroundColor: '#f8f9fc', border: '1.5px solid #e2e5f0',
                      borderRadius: '8px', fontSize: '0.9rem', color: '#1e1b4b', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#334155', fontSize: '0.8rem', marginBottom: '0.4rem' }}>New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    style={{
                      width: '100%', padding: '0.75rem', backgroundColor: '#f8f9fc', border: '1.5px solid #e2e5f0',
                      borderRadius: '8px', fontSize: '0.9rem', color: '#1e1b4b', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#334155', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    style={{
                      width: '100%', padding: '0.75rem', backgroundColor: '#f8f9fc', border: '1.5px solid #e2e5f0',
                      borderRadius: '8px', fontSize: '0.9rem', color: '#1e1b4b', boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    style={{
                      flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#475569',
                      border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotStatus === 'loading'}
                    style={{
                      flex: 1, padding: '0.75rem', background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                      color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {forgotStatus === 'loading' ? 'Saving...' : 'Reset'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout All Devices Modal Popup */}
      <AnimatePresence>
        {showLogoutAllModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: '1rem', backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowLogoutAllModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff', borderRadius: '16px', padding: '2rem',
                maxWidth: '380px', width: '100%',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12), 0 8px 16px rgba(0, 0, 0, 0.06)',
              }}
            >
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e1b4b', fontSize: '1.2rem' }}>Global Sign Out</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Verify your credentials to instantly terminate your active sessions on all devices.</p>
              
              <form onSubmit={handleLogoutAll}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#334155', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Username</label>
                  <input
                    type="text"
                    value={logoutAllUsername}
                    onChange={(e) => setLogoutAllUsername(e.target.value)}
                    placeholder="Enter your username"
                    style={{
                      width: '100%', padding: '0.75rem', backgroundColor: '#f8f9fc', border: '1.5px solid #e2e5f0',
                      borderRadius: '8px', fontSize: '0.9rem', color: '#1e1b4b', boxSizing: 'border-box'
                    }}
                  />
                </div>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontWeight: 600, color: '#334155', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Password</label>
                  <input
                    type="password"
                    value={logoutAllPassword}
                    onChange={(e) => setLogoutAllPassword(e.target.value)}
                    placeholder="Enter current password"
                    style={{
                      width: '100%', padding: '0.75rem', backgroundColor: '#f8f9fc', border: '1.5px solid #e2e5f0',
                      borderRadius: '8px', fontSize: '0.9rem', color: '#1e1b4b', boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowLogoutAllModal(false)}
                    style={{
                      flex: 1, padding: '0.75rem', background: '#f1f5f9', color: '#475569',
                      border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={logoutAllStatus === 'loading'}
                    style={{
                      flex: 1, padding: '0.75rem', background: '#ef4444',
                      color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {logoutAllStatus === 'loading' ? 'Terminating...' : 'Sign Out All'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};