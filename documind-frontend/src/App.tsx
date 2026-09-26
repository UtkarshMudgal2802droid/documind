import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
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
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#111118',
            border: '1px solid #e8e8ee',
            borderRadius: '8px',
            fontSize: '0.82rem',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          },
          success: {
            iconTheme: { primary: '#16a34a', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#dc2626', secondary: '#fff' },
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
                <div className="navbar-logo">DM</div>
                <div className="navbar-title">
                  {import.meta.env.VITE_PROJECT_NAME || 'DocuMind'}
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