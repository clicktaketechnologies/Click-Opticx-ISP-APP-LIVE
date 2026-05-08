import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../db';
import { BrandingAsset } from '../../types';
import { 
  Image as ImageIcon, Upload, Trash2, CheckCircle2, 
  AlertCircle, Loader2, Plus, Globe, FileText, X
} from 'lucide-react';

const BrandingMediaManager: React.FC = () => {
  const [assets, setAssets] = useState<BrandingAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAssets = async () => {
    setLoading(true);
    const res = await db.getBrandingMedia();
    if (res.success) {
      setAssets(res.assets);
    } else {
      setStatus({ type: 'error', msg: res.message || 'Failed to fetch media registry.' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssets();

    // Listen for real-time updates via global DB notify
    const unsubscribe = db.onConfigChange('*', () => {
      fetchAssets();
    });

    return () => unsubscribe();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      setStatus({ type: 'error', msg: 'Payload Too Large: Maximum blueprint size is 5MB.' });
      return;
    }

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      setStatus({ type: 'error', msg: 'Invalid Format: Only PNG/JPEG blueprints allowed.' });
      return;
    }

    setUploading(true);
    setStatus(null);

    try {
      const res = await db.uploadBrandingMedia(file);
      if (res.success) {
        setStatus({ type: 'success', msg: 'Asset synchronized to Cloudinary vault.' });
        fetchAssets();
      } else {
        setStatus({ type: 'error', msg: res.message || 'Transmission failed.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Kernel Error: Connection to storage node lost.' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Confirm decommissioning of this asset?')) return;

    try {
      const res = await db.deleteBrandingMedia(id);
      if (res.success) {
        setStatus({ type: 'success', msg: 'Asset decommissioned successfully.' });
        fetchAssets();
      } else {
        setStatus({ type: 'error', msg: res.message || 'Decommissioning failed.' });
      }
    } catch (err) {
      setStatus({ type: 'error', msg: 'Kernel Error: Failed to reach storage node.' });
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Header & Upload Control */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3">
            <Globe className="text-blue-600" size={24} />
            Media Asset Registry
          </h3>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
            Global Branding & Infrastructure Blueprints
          </p>
        </div>

        <div className="relative">
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden" 
            accept="image/png,image/jpeg"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`px-6 py-3 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 ${
              uploading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
            }`}
          >
            {uploading ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
            {uploading ? 'Transmitting...' : 'Upload Blueprint'}
          </button>
        </div>
      </div>

      {/* Status Notifications */}
      {status && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-premium ${
          status.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
            : 'bg-rose-50 border-rose-100 text-rose-700'
        }`}>
          <div className="flex items-center gap-3">
            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{status.msg}</span>
          </div>
          <button onClick={() => setStatus(null)} className="hover:opacity-70 transition-opacity">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Media Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square bg-slate-100 rounded-3xl animate-pulse border border-slate-200" />
          ))
        ) : assets.length === 0 ? (
          <div className="col-span-full py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
            <ImageIcon size={48} className="mb-4 opacity-20" />
            <p className="text-xs font-black uppercase tracking-widest italic">Registry Empty</p>
            <p className="text-[9px] font-bold uppercase tracking-tighter mt-2">Upload your first branding asset to begin.</p>
          </div>
        ) : (
          assets.map((asset) => (
            <div key={asset.id} className="group relative bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 hover:-translate-y-1">
              <div className="aspect-square relative overflow-hidden bg-slate-900">
                <img 
                  src={asset.url} 
                  alt={asset.file_name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Actions */}
                <div className="absolute top-3 right-3 flex gap-2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                  <button 
                    onClick={() => handleDelete(asset.id)}
                    className="p-2.5 bg-rose-500/90 text-white rounded-xl hover:bg-rose-600 backdrop-blur-md shadow-lg transition-all active:scale-90"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black text-slate-900 truncate pr-2 uppercase tracking-tight">
                    {asset.file_name}
                  </p>
                  <span className="text-[8px] font-black bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md uppercase tracking-widest">
                    {asset.file_type.split('/')[1]}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <FileText size={10} />
                    <span className="text-[9px] font-bold uppercase tracking-tighter">{formatSize(asset.file_size)}</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                    {new Date(asset.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BrandingMediaManager;
