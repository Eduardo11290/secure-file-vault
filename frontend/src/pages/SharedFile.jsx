import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldAlert, DownloadCloud, Lock, Loader2 } from 'lucide-react';
import api from '../api/client';

const SharedFile = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState(null);
  const [fileInfo, setFileInfo] = useState(null);
  const [downloaded, setDownloaded] = useState(false);
  const [pin, setPin] = useState('');

  // Pasul 1: Verificăm token-ul imediat ce se încarcă pagina
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Folosim noul endpoint /info creat anterior
        const response = await api.get(`/files/shared/${token}/info`);
        setFileInfo(response.data);
      } catch (err) {
        setError("This link has expired, was already used, or is completely invalid.");
      } finally {
        setChecking(false);
      }
    };
    verifyToken();
  }, [token]);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      // Trimitem PIN-ul în header sau ca query param dacă backend-ul îl cere
      const response = await api.get(`/files/shared/${token}`, {
        responseType: 'blob',
        headers: pin ? { 'X-Share-PIN': pin } : {}
      });

      let filename = fileInfo?.filename || 'secure-file.enc';
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      setDownloaded(true);
    } catch (err) {
      const msg = err.response?.status === 401 ? "Incorrect PIN. Access denied." : "Download failed. The link might have just expired.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center', padding: '3rem 2rem', border: '1px solid var(--border-color)' }}>
        
        {downloaded ? (
          <div className="animate-in fade-in zoom-in duration-300">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}>
                <ShieldAlert color="#10b981" size={64} />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Security Protocol Active</h2>
            <p style={{ color: 'var(--text-secondary)' }}>The file has been decrypted and the share link has been <strong>permanently burned</strong> from our database.</p>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <ShieldAlert color={error ? "var(--accent-destructive)" : "var(--accent-primary)"} size={64} />
            </div>
            
            <h2 style={{ margin: 0 }}>Secure File Share</h2>
            
            {fileInfo && !error && (
              <div style={{ margin: '1rem 0', padding: '1rem', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ready to decrypt</p>
                <p style={{ fontWeight: 600, fontSize: '1.1rem', marginTop: '0.25rem' }}>{fileInfo.filename}</p>
                <p style={{ fontSize: '0.8rem', opacity: 0.6 }}>{(fileInfo.size / 1024).toFixed(2)} KB</p>
              </div>
            )}

            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-destructive)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '0.85rem' }}>
              <strong>Single-Use Policy:</strong> Downloading this file will immediately invalidate the link.
            </div>

            {fileInfo?.requires_pin && !error && (
              <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                <label className="text-sm font-medium mb-1.5 block flex items-center gap-2">
                  <Lock size={14} /> This link requires a PIN
                </label>
                <input 
                  type="password"
                  placeholder="Enter access PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', color: 'white', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.3em' }}
                />
              </div>
            )}

            {error && (
              <div style={{ marginTop: '1rem', color: 'var(--accent-destructive)', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--accent-destructive)' }}>
                {error}
              </div>
            )}

            {!error && (
              <button 
                onClick={handleDownload} 
                disabled={loading || (fileInfo?.requires_pin && !pin)} 
                className="btn btn-primary" 
                style={{ marginTop: '1rem', padding: '1rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                {loading ? <Loader2 className="animate-spin" /> : <DownloadCloud />}
                {loading ? 'Processing Security...' : 'Download & Burn Link'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SharedFile;