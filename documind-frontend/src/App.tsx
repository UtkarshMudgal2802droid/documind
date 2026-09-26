import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { LogOut, Zap } from 'lucide-react';
import { DocumentUpload } from './components/DocumentUpload';
import { DocumentSearch } from './components/DocumentSearch';
import { Login } from './components/Login';
import './App.css';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Check if the user already logged in previously
  useEffect(() => {
    const token = localStorage.getItem('documind_token');
    if (token) setIsAuthenticated(true);
  }, []);

  // Secure logout handler
  const handleLogout = () => {
    localStorage.removeItem('documind_token');
    setIsAuthenticated(false);
  };

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'var(--bg-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
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
                  Docu<span>Mind</span>
                </div>
              </div>

              <div className="navbar-actions">
                <div className="navbar-status">
                  <span className="navbar-status-dot" />
                  Connected
                </div>
                <button className="btn btn-danger" onClick={handleLogout}>
                  <LogOut size={15} />
                  Sign Out
                </button>
              </div>
            </nav>

            {/* Hero */}
            <motion.div
              style={{ marginBottom: '2rem' }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 800,
                letterSpacing: '-1px',
                marginBottom: '0.4rem',
                lineHeight: 1.2
              }}>
                AI Document Intelligence
              </h1>
              <p style={{
                fontSize: '0.95rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Zap size={16} style={{ color: 'var(--accent-amber)' }} />
                Upload documents and search them using natural language, powered by vector embeddings
              </p>
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
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