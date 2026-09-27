import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { LogOut, Zap } from 'lucide-react';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentSearch } from './components/DocumentSearch';
import { Login } from './components/Login';
import { TOKEN_KEY } from './services/api';
import './App.css';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check if the user already logged in previously
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) setIsAuthenticated(true);
  }, []);

  // Secure logout handler
  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setIsAuthenticated(false);
    toast.success('Signed out successfully. See you next time!', {
      icon: '👋',
      duration: 3000,
    });
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
    </>
  );
};

export default App;