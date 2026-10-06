import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Monitor, Smartphone, Globe, LogOut, ShieldAlert } from 'lucide-react';
import { documentService } from '../services/api';
import type { UserSession } from '../services/api';

interface DeviceManagerProps {
  onLogoutAll: () => void;
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({ onLogoutAll }) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await documentService.getSessions();
      setSessions(data);
    } catch (err) {
      toast.error('Failed to load active devices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (sessionId: string) => {
    try {
      await documentService.revokeSession(sessionId);
      toast.success('Device signed out successfully.');
      fetchSessions();
    } catch (err) {
      toast.error('Failed to sign out device.');
    }
  };

  const getDeviceIcon = (deviceInfo: string) => {
    const info = deviceInfo.toLowerCase();
    if (info.includes('mobile') || info.includes('android') || info.includes('iphone')) return <Smartphone size={18} />;
    return <Monitor size={18} />;
  };

  if (loading) return null;

  return (
    <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#fff', borderRadius: '12px', border: '1px solid #e2e5f0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <ShieldAlert size={18} color="#6366f1" />
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e1b4b', margin: 0 }}>Active Devices</h3>
      </div>
      
      <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem' }}>
        You're currently signed in to the following devices. If you don't recognize a device, sign out immediately.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
        {sessions.map(session => (
          <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ padding: '0.5rem', background: '#e0e7ff', borderRadius: '50%', color: '#6366f1' }}>
                {getDeviceIcon(session.device_info)}
              </div>
              <div>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.25rem 0' }}>
                  {session.device_info} {session.is_current && <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#ecfdf5', color: '#059669', borderRadius: '12px', marginLeft: '0.5rem' }}>Current Session</span>}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: '#64748b' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Globe size={12} /> {session.ip_address}
                  </span>
                  <span>•</span>
                  <span>Started: {new Date(session.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            {!session.is_current && (
              <button 
                onClick={() => handleRevoke(session.id)}
                style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', padding: '0.5rem' }}
              >
                Sign Out
              </button>
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #e2e5f0', paddingTop: '1rem' }}>
        <button 
          onClick={onLogoutAll}
          style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', padding: '0.5rem 1rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <LogOut size={14} />
          Sign out all devices
        </button>
      </div>
    </div>
  );
};
