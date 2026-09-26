import React, { useState, useEffect } from 'react';
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
    <div className="app-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>DocuMind AI Architecture</h1>

        {/* Only show the Disconnect button if the user is actually logged in */}
        {isAuthenticated && (
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#21262d',
              padding: '0.5rem 1rem',
              border: '1px solid #30363d',
              borderRadius: '6px',
              color: '#c9d1d9',
              cursor: 'pointer'
            }}>
            Disconnect Session
          </button>
        )}
      </header>

      <main>
        {/* Gatekeeper: Show Login if unauthenticated, otherwise show the AI Pipeline */}
        {!isAuthenticated ? (
          <Login onLoginSuccess={() => setIsAuthenticated(true)} />
        ) : (
          <>
            <DocumentUpload />
            <DocumentSearch />
          </>
        )}
      </main>
    </div>
  );
};

export default App;