import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { LogOut, Zap, CheckCircle } from 'lucide-react';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentSearch } from './components/DocumentSearch';
import { Login } from './components/Login';
import { TOKEN_KEY, documentService } from './services/api';
import './App.css';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showLogoutAllModal, setShowLogoutAllModal] = useState(false);
  const [logoutAllUsername, setLogoutAllUsername] = useState('');
  const [logoutAllPassword, setLogoutAllPassword] = useState('');
  const [logoutAllStatus, setLogoutAllStatus] = useState<'idle' | 'loading'>('idle');

  // Check if the user already logged in previously
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) setIsAuthenticated(true);
  }, []);

  // Secure logout handler
  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setShowLogoutModal(true);
    setTimeout(() => {
      setShowLogoutModal(false);
    setTimeout(() => {
      setShowLogoutModal(false);
      setIsAuthenticated(false);
    }, 2000);
  };

  // Global secure logout handler
  const handleLogoutAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logoutAllUsername.trim() || !logoutAllPassword.trim()) {
       toast.error('Username and password are required to confirm global logout.');
       return;
    }

    try {
      setLogoutAllStatus('loading');
      await documentService.logoutAllDevices(logoutAllUsername.trim(), logoutAllPassword);
      setLogoutAllStatus('idle');
      setShowLogoutAllModal(false);
      setLogoutAllUsername('');
      setLogoutAllPassword('');
      toast.success("Success! You have been securely logged out from all devices globally.");
      // Automatically log them out of this local session as well
      handleLogout();
    } catch (err: any) {
      setLogoutAllStatus('idle');
      const detail = err.response?.data?.detail || err.message || 'Failed to logout. Please check credentials.';
      toast.error(detail);
    }
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1e1b4b',
            border: '1px solid #e2e5f0',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(99, 102, 241, 0.1), 0 2px 6px rgba(0,0,0,0.04)',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#fff' },
            style: {
              border: '1px solid rgba(5, 150, 105, 0.15)',
            },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
            style: {
              border: '1px solid rgba(220, 38, 38, 0.15)',
            },
          },
        }}
      />

      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Login onLoginSuccess={() => setIsAuthenticated(true)} />
          </motion.div>
        ) : (
          <motion.div
            key="dashboard"
            className="app-shell"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Navbar */}
            <nav className="navbar">
              <div className="navbar-brand">
                <div className="navbar-logo" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}>DM</div>
                <div className="navbar-title">
                  {import.meta.env.VITE_PROJECT_NAME || 'DocuMind'}<span style={{ color: '#6366f1' }}>.ai</span>
                </div>
              </div>

              <div className="navbar-actions">
                <div className="navbar-status">
                  <span className="navbar-status-dot" />
                  Connected
                </div>
                <button 
                  className="btn" 
                  style={{ background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', fontSize: '0.8rem', padding: '0.4rem 0.8rem' }} 
                  onClick={() => setShowLogoutAllModal(true)}
                  title="Sign out from all devices globally"
                >
                  Global Sign Out
                </button>
                <button className="btn btn-danger" onClick={handleLogout}>
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </nav>

            {/* Hero */}
            <motion.div
              style={{ marginBottom: '1.75rem' }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 style={{
                fontSize: '1.65rem',
                fontWeight: 750,
                letterSpacing: '-0.8px',
                marginBottom: '0.3rem',
                lineHeight: 1.2,
                color: 'var(--text-primary)'
              }}>
                AI Document Intelligence
              </h1>
              <p style={{
                fontSize: '0.88rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}>
                <Zap size={15} style={{ color: 'var(--accent-amber)' }} />
                Upload documents and search using natural language
              </p>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <DocumentUpload />
              <DocumentSearch />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign Out Modal */}
      <AnimatePresence>
        {showLogoutModal && (
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
                Signed out successfully
              </p>
              <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Redirecting to login...
              </p>
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
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    </>
  );
};

export default App;