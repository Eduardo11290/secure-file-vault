import React, { useState } from 'react';
import { X, Link as LinkIcon, Send, Copy, CheckCheck, Loader2, Mail } from 'lucide-react';
import apiClient from '../api/client';

export default function ShareModal({ file, onClose }) {
  const [mode, setMode] = useState('choose'); // 'choose' | 'email' | 'link'
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  if (!file) return null;

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      await apiClient.post(`/files/${file.id}/share-email`, {
        recipient_email: email
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send email.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.post(`/files/${file.id}/share`);
      const token = response.data.share_token;
      setShareLink(`${window.location.origin}/shared/${token}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate link.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
    } catch {
      const el = document.createElement('textarea');
      el.value = shareLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const reset = () => {
    setMode('choose');
    setEmail('');
    setShareLink(null);
    setSuccess(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-xl px-4 animate-in fade-in duration-200">
      <div className="bg-slate-800/90 border border-slate-700 rounded-2xl w-full max-w-md shadow-[0_0_50px_rgba(0,0,0,0.6)] overflow-hidden relative animate-in zoom-in-95 duration-200">

        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

        <button onClick={onClose} className="absolute top-5 right-5 text-slate-400 hover:text-white bg-slate-900/50 hover:bg-slate-800 rounded-full p-1.5 transition-all z-10">
          <X size={18} />
        </button>

        <div className="p-7 relative z-10">
          <h2 className="text-xl font-bold text-white mb-2 flex items-center space-x-2">
            <LinkIcon size={20} className="text-emerald-400" />
            <span>Secure Share</span>
          </h2>
          <p className="text-slate-400 text-sm font-mono mb-6 pb-5 border-b border-slate-700/60 truncate" title={file.name}>
            {file.name}
          </p>

          {/* SUCCESS STATE */}
          {success && (
            <div className="space-y-4 text-center py-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                <CheckCheck size={28} className="text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Email Sent!</p>
                <p className="text-slate-400 text-sm mt-1">
                  Secure link delivered to <span className="text-emerald-400 font-mono">{email}</span>
                </p>
              </div>
              <p className="text-xs text-slate-500">
                The link expires in 24 hours and can only be used once.
              </p>
            </div>
          )}

          {/* LINK GENERATED STATE */}
          {!success && shareLink && (
            <div className="space-y-4">
              <p className="text-sm text-emerald-400 font-medium flex items-center gap-2">
                <CheckCheck size={16} /> Link generat cu succes!
              </p>
              <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-500/30 font-mono text-xs text-slate-300 break-all">
                {shareLink}
              </div>
              <button
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all duration-300 ${
                  copied
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600'
                }`}
              >
                {copied ? <><CheckCheck size={16} />Copied!</> : <><Copy size={16} />Copy Link</>}
              </button>
              <p className="text-xs text-slate-500 text-center">
                Link-ul poate fi folosit o singură dată și expiră în 24 ore.
              </p>
            </div>
          )}

          {/* CHOOSE MODE */}
          {!success && !shareLink && mode === 'choose' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-400 mb-4">Cum vrei să trimiți fișierul?</p>

              <button
                onClick={() => setMode('email')}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-700/80 hover:border-emerald-500/40 hover:bg-slate-900 transition-all group"
              >
                <div className="p-2.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-colors">
                  <Mail size={20} className="text-emerald-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Send via Email</p>
                  <p className="text-slate-400 text-xs mt-0.5">Destinatarul primește link-ul direct în inbox</p>
                </div>
              </button>

              <button
                onClick={() => setMode('link')}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-slate-900/60 border border-slate-700/80 hover:border-indigo-500/40 hover:bg-slate-900 transition-all group"
              >
                <div className="p-2.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
                  <LinkIcon size={20} className="text-indigo-400" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">Copy Link</p>
                  <p className="text-slate-400 text-xs mt-0.5">Generează un link pe care îl poți trimite manual</p>
                </div>
              </button>

              <div className="mt-2 p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-500 space-y-1">
                <p>🔥 Burn after reading — single use only</p>
                <p>⏱ Expires after 24 hours</p>
                <p>🔒 AES-256-GCM encrypted at all times</p>
              </div>
            </div>
          )}

          {/* EMAIL MODE */}
          {!success && !shareLink && mode === 'email' && (
            <form onSubmit={handleSendEmail} className="space-y-4">
              <button type="button" onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 mb-2">
                ← Back
              </button>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Recipient Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  required
                  className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono placeholder-slate-600"
                />
              </div>
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
              )}
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-900 font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" />Sending...</> : <><Send size={16} />Send Secure Email</>}
              </button>
            </form>
          )}

          {/* LINK MODE */}
          {!success && !shareLink && mode === 'link' && (
            <div className="space-y-4">
              <button type="button" onClick={reset} className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1 mb-2">
                ← Back
              </button>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/80 text-sm text-slate-400 space-y-2">
                <p>🔥 <span className="text-slate-300 font-medium">Burn after reading</span> — single use.</p>
                <p>⏱ Expiră după <span className="text-slate-300 font-medium">24 de ore</span>.</p>
                <p>🔒 <span className="text-slate-300 font-medium">AES-256-GCM</span> encrypted.</p>
              </div>
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
              )}
              <button
                onClick={handleGenerateLink}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" />Generating...</> : <><LinkIcon size={16} />Generate Secure Link</>}
              </button>
            </div>
          )}
        </div>

        <div className="px-7 py-4 bg-slate-900/80 border-t border-slate-700/80 flex justify-end">
          {success ? (
            <button onClick={onClose} className="px-6 py-2 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-900 transition-colors">
              Done
            </button>
          ) : (
            <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
              {shareLink ? 'Close' : 'Cancel'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
