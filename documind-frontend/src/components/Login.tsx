import React, { useState } from 'react';
import { documentService } from '../services/api';

interface LoginProps {
    onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
    // Defaulting to Utkarsh's local credentials for easy testing
    const [username, setUsername] = useState('utkarsh_admin');
    const [password, setPassword] = useState('backend_auth_2026');
    const [status, setStatus] = useState('');
    const [isLoggingIn, setIsLoggingIn] = useState(false);

    const handleLogin = async () => {
        try {
            setIsLoggingIn(true);
            setStatus('Authenticating with AWS Gateway...');
            await documentService.login(username, password);
            setStatus('Authentication Successful!');
            onLoginSuccess();
        } catch (error) {
            setStatus('Authentication Failed: 401 Unauthorized');
            console.error(error);
        } finally {
            setIsLoggingIn(false);
        }
    };

    return (
        <div className="card" style={{ borderTop: '4px solid #ff7b72' }}>
            <h2>🔒 Admin Gateway Authentication</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="Admin Username"
                />
                <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Admin Password"
                />
                <button onClick={handleLogin} disabled={isLoggingIn || !username || !password}>
                    {isLoggingIn ? 'Verifying...' : 'Establish Secure Connection'}
                </button>
                {status && <p style={{ color: status.includes('Failed') ? '#ff7b72' : '#3fb950' }}>{status}</p>}
            </div>
        </div>
    );
};