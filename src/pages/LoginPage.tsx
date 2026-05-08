/**
 * Login Page - Modern 2026 Glassmorphism Design
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, ArrowRight, Eye, EyeOff, Shield } from 'lucide-react';
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

export const LoginPage: React.FC = () => {
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
      const response = await axios.post('/api/auth/login', {
        email: form.email,
        password: form.password,
      });

      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      const message = err.response?.data?.error || 'Une erreur est survenue';
      updateField('error', message);
    } finally {
      updateField('isLoading', false);
    }
  }, [form.email, form.password, login, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F7F5] via-white to-[#E8F5F2] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -right-1/2 w-full h-full bg-emerald-500/10 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1], rotate: [0, -60, 0] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-teal-500/10 rounded-full blur-[150px]"
        />
        <motion.div
          animate={{ y: [0, -50, 0], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-400/20 rounded-full blur-[100px]"
        />
      </div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Glass Card */}
        <div className="relative bg-white rounded-3xl p-8 md:p-10 shadow-xl shadow-emerald-100/50 border border-emerald-50 overflow-hidden">
          {/* Shine Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />

          {/* Header */}
          <div className="text-center mb-8 relative">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-6 relative"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl blur-xl opacity-50" />
              <div className="relative w-full h-full bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
            </motion.div>

            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              SIMOnPARA
            </h1>
            <p className="text-gray-500 text-sm font-medium tracking-wider uppercase">
              ERP Business Suite 2026
            </p>
          </div>

          {/* Error Message */}
          {form.error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 backdrop-blur-sm"
            >
              <p className="text-rose-500 text-sm font-medium text-center flex items-center justify-center gap-2">
                <Shield className="w-4 h-4" />
                {form.error}
              </p>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                Email Professionnel
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-400 rounded-xl py-4 pl-12 pr-4 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all duration-300"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                Mot De Passe
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input
                  type={form.showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-400 rounded-xl py-4 pl-12 pr-12 text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all duration-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => updateField('showPassword', !form.showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-500 transition-colors"
                >
                  {form.showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={form.isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
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
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            </motion.button>
          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Besoin d'assistance ?{' '}
              <button className="text-emerald-600 hover:text-emerald-500 font-medium transition-colors">
                Support Technique
              </button>
            </p>
          </div>
        </div>

        {/* Version Badge */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <span className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">
            v2.0.6 © 2026 SIMOnPARA
          </span>
        </div>
      </motion.div>
    </div>
  );
};
