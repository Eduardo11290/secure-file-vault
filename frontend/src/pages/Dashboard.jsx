import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../store/authSlice';
import { LogOut, UploadCloud, File as FileIcon, Trash2, Share2, Download, Search } from 'lucide-react';
import api from '../api/client';

const Dashboard = () => {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareToken, setShareToken] = useState(null);
  
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();

  useEffect(() => {
    fetchFiles();
  }, [search]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await api.get('/files/', {
        params: { search: search || undefined }
      });
      setFiles(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchFiles();
    } catch (err) {
      alert("Failed to upload file");
    }
  };

  const handleDownload = async (fileId, filename) => {
    try {
      const response = await api.get(`/files/download/${fileId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert("Failed to download file");
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Are you sure you want to delete this file?")) return;
    try {
      await api.delete(`/files/${fileId}`);
      fetchFiles();
    } catch (err) {
      alert("Failed to delete file");
    }
  };

  const handleShare = async (fileId) => {
    try {
      const response = await api.post(`/files/${fileId}/share`);
      const token = response.data.share_token;
      setShareToken(`${window.location.origin}/shared/${token}`);
    } catch (err) {
      alert("Failed to generate share link");
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', backgroundColor: 'var(--bg-card)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <FileIcon color="var(--accent-primary)" size={24} />
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>SecureVault</h2>
        </div>
        <div style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className="btn btn-outline" style={{ textAlign: 'left', borderColor: 'var(--accent-primary)', color: 'var(--accent-primary)' }}>My Vault</button>
          <button className="btn btn-outline" style={{ textAlign: 'left', border: 'none' }}>Audit Logs</button>
          <button className="btn btn-outline" style={{ textAlign: 'left', border: 'none' }}>Security (2FA)</button>
        </div>
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button 
            className="btn btn-outline" 
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={() => dispatch(logoutUser())}
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{ padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Dashboard</h2>
          <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '300px' }}>
            <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '0.75rem' }} />
            <input 
              type="text" 
              placeholder="Search files..." 
              className="input-field" 
              style={{ width: '100%', paddingLeft: '2.5rem', margin: 0, borderRadius: '999px', backgroundColor: 'var(--bg-card)' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        {/* Content Area */}
        <div style={{ padding: '2rem', flex: 1, overflowY: 'auto' }}>
          
          {/* Upload Zone */}
          <div 
            className="card" 
            onClick={() => fileInputRef.current?.click()}
            style={{ 
              border: '2px dashed var(--border-color)', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '3rem', 
              marginBottom: '2rem',
              cursor: 'pointer',
              backgroundColor: 'rgba(30, 41, 59, 0.5)'
            }}
          >
            <UploadCloud size={48} color="var(--accent-primary)" style={{ marginBottom: '1rem' }} />
            <h3 style={{ margin: 0 }}>Drag & Drop files securely</h3>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>AES-256 client-side encryption simulation</p>
            <input type="file" ref={fileInputRef} onChange={handleUpload} style={{ display: 'none' }} />
          </div>

          {/* Files Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Filename</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem' }}>Loading vault...</td></tr>}
                {!loading && files.length === 0 && (
                  <tr><td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Vault is completely empty.</td></tr>
                )}
                {files.map(file => (
                  <tr key={file.id}>
                    <td style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                      <FileIcon size={16} color="var(--text-secondary)" /> {file.filename}
                    </td>
                    <td className="mono-text" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(file.created_at).toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => handleDownload(file.id, file.filename)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem', border: 'none' }} title="Download">
                        <Download size={16} color="var(--accent-primary)" />
                      </button>
                      <button onClick={() => handleShare(file.id)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', marginRight: '0.5rem', border: 'none' }} title="Share">
                        <Share2 size={16} color="var(--text-primary)" />
                      </button>
                      <button onClick={() => handleDelete(file.id)} className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', border: 'none' }} title="Delete">
                        <Trash2 size={16} color="var(--accent-destructive)" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {shareToken && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShareToken(null) }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
            <h3>One-Time Burn Link</h3>
            <p style={{ color: 'var(--accent-destructive)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              Warning: This is a burn-after-reading link. It will expire immediately upon download.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" className="input-field mono-text" value={shareToken} readOnly style={{ margin: 0 }} />
              <button className="btn btn-primary" onClick={() => { navigator.clipboard.writeText(shareToken); alert('Copied!'); }}>Copy</button>
            </div>
            <button className="btn btn-outline" style={{ marginTop: '1rem', width: '100%' }} onClick={() => setShareToken(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
