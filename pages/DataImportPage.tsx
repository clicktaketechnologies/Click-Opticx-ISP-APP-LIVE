
import React, { useState, useRef } from 'react';
import { AppState } from '../types';
import { FileInput, Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Info, FileCode, Trash2, ListChecks, FileText } from 'lucide-react';
import { db } from '../db';

const DataImportPage: React.FC<{ state: AppState }> = ({ state }) => {
  const [csvData, setCsvData] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{success: number, failed: number, errors: string[]} | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processData = async (data: string) => {
    if (!data.trim()) return;
    setIsProcessing(true);
    setImportStatus(null);
    const lines = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
    if (lines.length < 2) {
      alert("Please paste your customer data including a header row.");
      setIsProcessing(false);
      return;
    }
    
    const parseRow = (row: string) => {
      const delimiter = row.includes('\t') ? '\t' : (row.includes(';') ? ';' : ',');
      return row.split(delimiter).map(v => v.replace(/^"|"$/g, '').trim());
    };
    
    const rawHeaders = parseRow(lines[0]);
    const headers = rawHeaders.map(h => h.toLowerCase());
    const rows = lines.slice(1);
    
    let success = 0;
    let fail = 0;
    const errors: string[] = [];
    
    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];
      try {
        const values = parseRow(row);
        if (values.length < 2) continue;
        const userData: any = { name: '', phone: '', address: '', area: '', macIp: '', packageId: '' };
        headers.forEach((h, i) => {
          const val = values[i];
          if (!val) return;
          if (h.match(/name|subscriber|customer|identity/)) userData.name = val;
          if (h.match(/phone|mobile|contact/)) userData.phone = val;
          if (h.match(/address|location/)) userData.address = val;
          if (h.match(/area|sector|zone/)) userData.area = val;
        });
        if (!userData.name) throw new Error("Missing customer name");
        await db.addUser(userData);
        success++;
      } catch (e: any) {
        errors.push(`Line ${idx+2}: ${e.message}`);
        fail++;
      }
    }
    setImportStatus({ success, failed: fail, errors });
    setIsProcessing(false);
    setCsvData('');
    db.logNotification('all', 'success', 'Import Complete', `Added ${success} new customers from your list.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Bulk Customer Import</h2>
          <p className="text-slate-500 font-medium">Add multiple customers at once from Excel or CSV files.</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3.5 bg-white border border-slate-200 rounded-2xl font-black text-xs hover:bg-slate-50 shadow-sm transition-all active:scale-95 uppercase tracking-widest"
        >
          <FileSpreadsheet size={18} className="text-blue-500" />
          Choose File
          <input type="file" accept=".csv,.xlsx,.xls,.txt" className="hidden" ref={fileInputRef} onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setFileName(file.name);
              const reader = new FileReader();
              reader.onload = (ev) => setCsvData(ev.target?.result as string);
              reader.readAsText(file);
            }
          }} />
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 md:p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="p-5 bg-blue-50 border border-blue-100 rounded-2xl text-center">
              <FileSpreadsheet className="text-blue-500 mb-3 mx-auto" size={24} />
              <p className="text-xs font-bold text-blue-900">Spreadsheets Supported</p>
           </div>
           <div className="p-5 bg-purple-50 border border-purple-100 rounded-2xl text-center">
              <FileText className="text-purple-500 mb-3 mx-auto" size={24} />
              <p className="text-xs font-bold text-purple-900">Auto-Detects Columns</p>
           </div>
           <div className="p-5 bg-green-50 border border-green-100 rounded-2xl text-center">
              <CheckCircle className="text-green-500 mb-3 mx-auto" size={24} />
              <p className="text-xs font-bold text-green-900">Safety Verification</p>
           </div>
        </div>

        <div className="relative">
          <textarea 
            className="w-full h-64 md:h-80 px-6 py-8 bg-slate-50 border border-slate-200 rounded-[2rem] outline-none font-mono text-xs focus:ring-4 focus:ring-blue-500/10 transition-all resize-none shadow-inner"
            placeholder="Paste your customer list here (make sure the first row has column titles)..."
            value={csvData}
            onChange={(e) => setCsvData(e.target.value)}
          />
          {fileName && <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">{fileName}</div>}
        </div>

        <button 
          onClick={() => processData(csvData)}
          disabled={!csvData.trim() || isProcessing}
          className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-4 shadow-xl uppercase tracking-[0.15em] text-xs disabled:opacity-50"
        >
          {isProcessing ? 'Processing data...' : 'Start Adding Customers'}
        </button>
      </div>

      {importStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-8">
          <div className="bg-green-50 p-8 rounded-[2rem] border border-green-100 flex items-center gap-6">
            <CheckCircle className="text-green-500" size={40} />
            <div><p className="text-[10px] font-black uppercase text-green-600">Successfully Added</p><h4 className="text-3xl font-black">{importStatus.success} Customers</h4></div>
          </div>
          <div className="bg-red-50 p-8 rounded-[2rem] border border-red-100 flex items-center gap-6">
            <AlertTriangle className="text-red-500" size={40} />
            <div><p className="text-[10px] font-black uppercase text-red-600">Could Not Add</p><h4 className="text-3xl font-black">{importStatus.failed} Errors</h4></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataImportPage;

