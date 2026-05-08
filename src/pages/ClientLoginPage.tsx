import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FormState {
  email: string;
  password: string;
  showPassword: boolean;
  error: string;
  isLoading: boolean;
}

const INITIAL_STATE: FormState = {
  email: '',
  password: '',
  showPassword: false,
  error: '',
  isLoading: false,
};

export const ClientLoginPage: React.FC = () => {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const { login } = useAuth();
  const navigate = useNavigate();

  const updateField = useCallback(<K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    updateField('isLoading', true);
    updateField('error', '');

    try {
      const res = await axios.post('/api/auth/client-login', { email: form.email, password: form.password });
      const { token, user } = res.data;
      login(token, user);
      navigate('/client/panel');
    } catch (err: any) {
      updateField('error', err.response?.data?.error || 'Email ou mot de passe incorrect');
    } finally {
      updateField('isLoading', false);
    }
  }, [form.email, form.password, login, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F0F7] via-white to-[#F0E8F5] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-purple-500/10 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, -60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-pink-500/10 rounded-full blur-[150px]"
        />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="relative bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-purple-100/50 border border-purple-50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

          <div className="text-center mb-8 relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl blur-xl opacity-50" />
              <div className="relative w-full h-full bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Building2 className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Espace Client
            </h1>
            <p className="text-gray-500 text-sm">
              Connectez-vous à votre espace client
            </p>
          </div>

          {form.error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 backdrop-blur-sm"
            >
              <p className="text-rose-500 text-sm font-medium text-center">
                {form.error}
              </p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                Email
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-purple-400 rounded-xl py-4 pl-12 pr-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all duration-300"
                  placeholder="client@pharmacie.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                Mot De Passe
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors" size={18} />
                <input
                  type={form.showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-purple-400 rounded-xl py-4 pl-12 pr-12 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-100 transition-all duration-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => updateField('showPassword', !form.showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
                >
                  {form.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={form.isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full relative overflow-hidden bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              <span className="relative z-10 flex items-center gap-2">
                {form.isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    Se Connecter
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center space-y-2">
            <p className="text-xs text-gray-400">
              Pas encore de compte ?{' '}
                <button className="text-purple-600 hover:text-purple-500 font-medium transition-colors">
                Contactez-nous
              </button>
            </p>
            <button className="text-xs text-gray-500 hover:text-gray-400 transition-colors">
              Mot de passe oublié ?
            </button>
          </div>
        </div>

        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">
            Espace Client © 2026
          </span>
        </div>
      </motion.div>
    </div>
  );
};
