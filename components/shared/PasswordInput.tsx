
import React, { useState, useMemo } from 'react';
// Fix: Added CheckCircle to imports
import { Eye, EyeOff, Lock, Check, X, Shield, ShieldAlert, ShieldCheck, CheckCircle } from 'lucide-react';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  showStrength?: boolean;
  minChars?: number;
  // Added autoComplete to fix property not found errors in consuming components
  autoComplete?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
  label, value, onChange, placeholder = "••••••••", required = false, className = "", showStrength = false, minChars = 8,
  // Added autoComplete to destructuring
  autoComplete
}) => {
  const [show, setShow] = useState(false);

  const strength = useMemo(() => {
    if (!value) return 0;
    let score = 0;
    if (value.length >= minChars) score += 1;
    if (/[A-Z]/.test(value)) score += 1;
    if (/[0-9]/.test(value)) score += 1;
    if (/[^A-Za-z0-9]/.test(value)) score += 1;
    return score;
  }, [value, minChars]);

  const strengthData = [
    { label: 'Insecure', color: 'bg-slate-200', text: 'text-slate-400', icon: ShieldAlert },
    { label: 'Weak Node', color: 'bg-rose-500', text: 'text-rose-500', icon: ShieldAlert },
    { label: 'Normal', color: 'bg-amber-500', text: 'text-amber-500', icon: Shield },
    { label: 'Robust', color: 'bg-blue-500', text: 'text-blue-500', icon: ShieldCheck },
    { label: 'Encrypted-Grade', color: 'bg-green-500', text: 'text-green-500', icon: ShieldCheck },
  ][strength];

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-between items-center ml-1 mb-1">
        <label className="text-sm font-semibold text-[#334155]">{label}</label>
        {showStrength && value && (
          <div className="flex items-center gap-1.5">
            <strengthData.icon size={12} className={strengthData.text} />
            <span className={`text-[10px] font-bold uppercase tracking-wide ${strengthData.text}`}>{strengthData.label}</span>
          </div>
        )}
      </div>
      <div className="relative group">
        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors pointer-events-none" size={18} />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="w-full pl-12 pr-14 py-4 bg-[#F8FAFC] border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-[#0F172A] placeholder:text-slate-400"
          style={{ paddingLeft: '3.5rem' }}
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50/50 rounded-xl transition-all"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {showStrength && value && (
        <div className="flex gap-1 px-1 h-1">
          {[1, 2, 3, 4].map(step => (
            <div key={step} className={`flex-1 rounded-full transition-all duration-500 ${strength >= step ? strengthData.color : 'bg-slate-100'}`}></div>
          ))}
        </div>
      )}

      {showStrength && value && (
        <div className="flex flex-wrap gap-2 px-1 mt-2">
          {[
            { label: `${minChars}+ Chars`, pass: value.length >= minChars },
            { label: 'A-Z', pass: /[A-Z]/.test(value) },
            { label: '0-9', pass: /[0-9]/.test(value) },
            { label: '@#$', pass: /[^A-Za-z0-9]/.test(value) }
          ].map((rule, i) => (
            <div key={i} className={`flex items-center gap-1 text-[7px] font-black uppercase tracking-tighter ${rule.pass ? 'text-green-500' : 'text-slate-300'}`}>
              {rule.pass ? <CheckCircle size={8} /> : <X size={8} />} {rule.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PasswordInput;

