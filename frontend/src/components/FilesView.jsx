import React, { useState, useEffect, useRef } from 'react';
import { FileText, FileArchive, ImageIcon, Share2, Download, Search, UploadCloud, Loader2 } from 'lucide-react';
import ShareModal from './ShareModal';
import apiClient from '../api/client';

export default function FilesView() {
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [sharingFile, setSharingFile] = useState(null);
  const [search, setSearch] = useState('');
  
  const fileInputRef = useRef(null);

  // Format file size from bytes to human-readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  const fetchMyFiles = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/files/'); 
      
      const formattedFiles = response.data.map(file => ({
        id: file.id,
        name: file.filename || file.name || 'Unknown_File',
        type: file.mime_type?.includes('pdf') ? 'pdf' : 
              file.mime_type?.includes('zip') ? 'zip' : 
              file.mime_type?.includes('image') ? 'image' : 'document',
        size: formatBytes(file.file_size || 0),
        date: new Date(file.created_at).toLocaleDateString('en-US')
      }));
      setFiles(formattedFiles);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyFiles();
  }, []);

  const getIconStatus = (type) => {
    switch(type) {
      case 'pdf': return <FileText className="text-rose-400" size={32} />;
      case 'zip': return <FileArchive className="text-amber-400" size={32} />;
      case 'image': return <ImageIcon className="text-blue-400" size={32} />;
      default: return <FileText className="text-slate-400" size={32} />;
    }
  };

  // Upload file logic
  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    const formData = new FormData();
    formData.append('file', selectedFile);
    
    try {
      setIsUploading(true);
      await apiClient.post('/files/upload', formData);
      await fetchMyFiles();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Check console for details.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Download file logic
  const handleDownload = async (fileId, filename) => {
    try {
      const response = await apiClient.get(`/files/download/${fileId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Download failed. Check console for details.');
    }
  };

  const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-5 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">My Vault</h2>
          <p className="text-slate-400 text-sm">Securely manage your encrypted files.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch gap-4">
          <div className="relative w-full sm:w-64 h-11">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-full bg-slate-900/60 border border-slate-700 rounded-full pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all shadow-inner backdrop-blur-sm" 
            />
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
          />
          
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="h-11 flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold px-6 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isUploading ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
            <span>{isUploading ? 'Uploading...' : 'Upload File'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1,2,3].map(n => (
            <div key={n} className="backdrop-blur-md bg-white/5 border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col h-44 relative overflow-hidden group">
               <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-[shimmer_1.5s_infinite]"></div>
               <div className="flex items-start justify-between mb-auto relative z-10">
                 <div className="w-14 h-14 bg-slate-800/80 rounded-xl"></div>
                 <div className="w-9 h-9 bg-slate-800/80 rounded-full"></div>
               </div>
               <div className="w-3/4 h-4 bg-slate-800/80 rounded mt-6 relative z-10"></div>
               <div className="w-1/2 h-3 bg-slate-800/80 rounded mt-3 relative z-10"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredFiles.map(file => (
            <div key={file.id} className="group backdrop-blur-md bg-white/5 border border-slate-700/60 hover:border-emerald-500/50 rounded-2xl p-6 shadow-2xl transition-all duration-300 hover:shadow-[0_10px_30px_rgba(16,185,129,0.15)] hover:-translate-y-1.5 flex flex-col h-44 relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-bl-[100px] -z-10 group-hover:bg-emerald-500/5 transition-colors"></div>
              <div className="flex justify-between items-start mb-auto z-10">
                <div className="p-3 bg-slate-800/80 backdrop-blur-sm rounded-xl group-hover:bg-slate-800 border border-slate-700/50 group-hover:border-slate-600 transition-all shadow-inner">
                  {getIconStatus(file.type)}
                </div>
                <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 translate-x-2 group-hover:translate-x-0">
                  <button 
                    onClick={() => handleDownload(file.id, file.name)}
                    className="p-2.5 text-slate-400 hover:text-white bg-slate-800/80 backdrop-blur-sm rounded-full hover:bg-slate-700 border border-slate-700/50 transition-all shadow-sm"
                  >
                    <Download size={18} />
                  </button>
                  <button 
                    onClick={() => setSharingFile(file)}
                    className="p-2.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)] rounded-full border border-emerald-500/20 transition-all"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
              <div className="mt-5 z-10">
                <p className="font-semibold text-slate-200 text-lg truncate" title={file.name}>{file.name}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm font-mono text-slate-400 px-2 py-0.5 bg-slate-900/60 rounded border border-slate-700/50">{file.size}</span>
                  <span className="text-sm text-slate-500 opacity-80">{file.date}</span>
                </div>
              </div>
            </div>
          ))}
          {filteredFiles.length === 0 && (
            <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-700/50 rounded-2xl bg-white/5 backdrop-blur-sm">
               <FileText className="mx-auto text-slate-500 mb-4" size={48} />
               <p className="text-slate-300 font-medium text-lg mb-1">No files found.</p>
               <p className="text-slate-500 text-sm">Upload a file to encrypt and store it in your vault.</p>
            </div>
          )}
        </div>
      )}
      {sharingFile && <ShareModal file={sharingFile} onClose={() => setSharingFile(null)} />}
    </div>
  );
}