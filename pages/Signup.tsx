import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { ShieldCheck, User, Mail, Phone, Lock, MapPin, Loader2 } from 'lucide-react';
import { useToast } from '../components/shared/Toast';
import { supabase, SUPABASE_REDIRECT_URL } from '../lib/supabase';
import { db } from '../db';

const Signup = () => {
  const navigate = useNavigate();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    agreeTerms: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return "Full Name is required.";
    if (!formData.username.trim()) return "Username is required.";
    
    // Contact Number (Tel, Pattern: 03XX-XXXXXXX)
    const phonePattern = /^03\d{2}-\d{7}$/;
    if (!phonePattern.test(formData.phone)) return "Phone must follow the pattern 03XX-XXXXXXX.";
    
    if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email)) return "Valid Email Address is required.";
    
    // Password (Min 8 chars, 1 upper, 1 number)
    const passPattern = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passPattern.test(formData.password)) return "Password must be at least 8 characters, with 1 uppercase letter and 1 number.";
    
    if (formData.password !== formData.confirmPassword) return "Passwords do not match.";
    if (!formData.address.trim()) return "Installation Address is required.";
    if (!formData.agreeTerms) return "You must agree to the Service Agreement & Terms.";
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    
    const validationError = validateForm();
    if (validationError) {
      showError('Validation Error', validationError);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await db.submitSignupRequest({
        email: formData.email,
        password: formData.password,
        name: formData.fullName,
        username: formData.username,
        phone: formData.phone,
        address: formData.address,
      });

      if (!response.success) {
        showError('Signup Failed', response.message);
        return;
      }

      // Post-Signup: Redirect to verify-email
      setSuccessMessage("Account created. Please check email to verify, or proceed to login.");
      success("Success", "Account created successfully.");
      
      // Auto-redirect to verify screen
      setTimeout(() => {
        navigate(`/verify-email?userId=${response.userId}&email=${encodeURIComponent(formData.email)}`);
      }, 1500);
      
    } catch (err: any) {
      showError('Error', err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <ShieldCheck size={32} className="text-white" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-black text-white tracking-tight">Create your account</h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Or{' '}
          <Link to="/auth/login" className="font-bold text-indigo-400 hover:text-indigo-300 transition-colors">
            sign in to your existing account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-slate-900 py-8 px-4 shadow-2xl sm:rounded-3xl sm:px-10 border border-slate-800">
          
          {successMessage ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                <ShieldCheck size={32} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Registration Successful</h3>
              <p className="text-slate-400 mb-8">{successMessage}</p>
              <Link to="/auth/login" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors inline-block">
                Proceed to Login
              </Link>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <input name="fullName" type="text" required value={formData.fullName} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all" placeholder="John Doe" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-500" />
                    </div>
                    <input name="username" type="text" required value={formData.username} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all" placeholder="johndoe123" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Contact Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-slate-500" />
                    </div>
                    <input name="phone" type="tel" required pattern="03\d{2}-\d{7}" title="Format: 03XX-XXXXXXX" value={formData.phone} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all" placeholder="03XX-XXXXXXX" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Email Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-500" />
                    </div>
                    <input name="email" type="email" required value={formData.email} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all" placeholder="you@example.com" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Create Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500" />
                    </div>
                    <input name="password" type="password" required value={formData.password} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all" placeholder="••••••••" />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500">Min 8 chars, 1 uppercase, 1 number</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Retype Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-500" />
                    </div>
                    <input name="confirmPassword" type="password" required value={formData.confirmPassword} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all" placeholder="••••••••" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Installation Address</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                    <MapPin className="h-5 w-5 text-slate-500" />
                  </div>
                  <textarea name="address" required rows={3} value={formData.address} onChange={handleInputChange} className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all resize-none" placeholder="Enter full installation address..." />
                </div>
              </div>

              <div className="flex items-center">
                <input id="agreeTerms" name="agreeTerms" type="checkbox" checked={formData.agreeTerms} onChange={handleInputChange} className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-slate-700 rounded bg-slate-900 cursor-pointer" />
                <label htmlFor="agreeTerms" className="ml-2 block text-sm text-slate-300 cursor-pointer">
                  I agree to the <a href="#" className="text-indigo-400 hover:text-indigo-300">Service Agreement & Terms</a>
                </label>
              </div>

              <div>
                <button type="submit" disabled={isSubmitting || !formData.agreeTerms} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
                  {isSubmitting ? (
                    <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Creating Account...</>
                  ) : (
                    'Sign up for service'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
