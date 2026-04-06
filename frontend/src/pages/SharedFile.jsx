import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ShieldAlert, DownloadCloud } from 'lucide-react';
import api from '../api/client';

const SharedFile = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/files/shared/${token}`, {
        responseType: 'blob'
      });
      // Extract filename from header
      let filename = 'secure-file.enc';
      const disposition = response.headers['content-disposition'];
      if (disposition && disposition.indexOf('filename=') !== -1) {
        const filenameFragment = disposition.split('filename=')[1];
        filename = filenameFragment.replace(/['"]/g, '');
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      setDownloaded(true);
    } catch (err) {
      setError("This link has expired, was already used, or is completely invalid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="card" style={{ width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'center', padding: '3rem 2rem' }}>
        
        {downloaded ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <ShieldAlert color="var(--accent-primary)" size={64} />
            </div>
            <h2>Download Complete</h2>
            <p style={{ color: 'var(--text-secondary)' }}>This link has now been permanently burned from our systems.</p>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <ShieldAlert color="var(--accent-destructive)" size={64} />
            </div>
            <h2 style={{ margin: 0 }}>Secure File Share</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              You have been sent a secure, single-use file. 
            </p>
            <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-destructive)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--accent-destructive)', fontSize: '0.875rem', fontWeight: 500 }}>
              This is a BURN-AFTER-READING link. It will expire immediately after download.
            </div>

            {error && (
              <div style={{ marginTop: '1rem', color: 'var(--accent-destructive)', fontWeight: 500 }}>{error}</div>
            )}

            {!error && (
              <button 
                onClick={handleDownload} 
                disabled={loading} 
                className="btn btn-primary" 
                style={{ marginTop: '1rem', padding: '1rem', fontSize: '1.125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <DownloadCloud /> {loading ? 'Decrypting...' : 'Download Secure File'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default SharedFile;
