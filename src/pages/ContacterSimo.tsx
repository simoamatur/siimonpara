/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CustomerDashboardLayout } from '../components/CustomerDashboardLayout';
import { MessageCircle, Send, Phone, Mail, MapPin, Clock, CheckCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export const ContacterSimo: React.FC = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    priority: 'normal',
  });
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post('/api/client/contact', formData);
      setIsSent(true);
      setFormData({ subject: '', message: '', priority: 'normal' });
    } catch { /* ignore */ }
    finally { setIsLoading(false); }
  };

  const contactInfo = [
    {
      icon: Phone,
      label: 'Téléphone',
      value: '+212 5XX XX XX XX',
      color: 'bg-emerald-100 text-emerald-600',
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'contact@simonpara.com',
      color: 'bg-purple-100 text-purple-600',
    },
    {
      icon: MapPin,
      label: 'Adresse',
      value: '123 Boulevard Mohamed V, Casablanca',
      color: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Clock,
      label: 'Horaires',
      value: 'Lun - Ven: 9h - 18h',
      color: 'bg-amber-100 text-amber-600',
    },
  ];

  return (
    <CustomerDashboardLayout>
      <div className=" mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4">
            <MessageCircle size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-700 mb-2">Contacter Simo</h1>
          <p className="text-gray-400">Nous sommes là pour vous aider. Envoyez-nous un message !</p>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Contact Form */}
          <div className="col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <AnimatePresence mode="wait">
                {isSent ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-12"
                  >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 rounded-full mb-4">
                      <CheckCircle size={40} className="text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-700 mb-2">Message envoyé !</h3>
                    <p className="text-gray-400 mb-6">
                      Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.
                    </p>
                    <button
                      onClick={() => setIsSent(false)}
                      className="px-6 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Envoyer un autre message
                    </button>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubmit}
                    className="space-y-6"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">
                        Sujet
                      </label>
                      <select
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="">Sélectionnez un sujet</option>
                        <option value="order">Question sur ma commande</option>
                        <option value="product">Information produit</option>
                        <option value="delivery">Problème de livraison</option>
                        <option value="payment">Question de paiement</option>
                        <option value="other">Autre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">
                        Priorité
                      </label>
                      <div className="flex gap-4">
                        {['low', 'normal', 'high'].map((priority) => (
                          <label
                            key={priority}
                            className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              formData.priority === priority
                                ? 'border-purple-500 bg-purple-50 text-purple-700'
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name="priority"
                              value={priority}
                              checked={formData.priority === priority}
                              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                              className="hidden"
                            />
                            <span className="text-sm font-semibold capitalize">
                              {priority === 'low' && 'Basse'}
                              {priority === 'normal' && 'Normale'}
                              {priority === 'high' && 'Urgente'}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-2">
                        Votre message
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        rows={6}
                        placeholder="Décrivez votre demande en détail..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send size={18} />
                          Envoyer le message
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Contact Info Sidebar */}
          <div className="space-y-4">
            {contactInfo.map((info, index) => (
              <motion.div
                key={info.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${info.color}`}>
                    <info.icon size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{info.label}</p>
                    <p className="text-sm font-semibold text-gray-700 mt-1">{info.value}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* Quick FAQ */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-100 p-4">
              <h4 className="font-bold text-purple-800 mb-3 flex items-center gap-2">
                <User size={16} />
                Questions fréquentes
              </h4>
              <ul className="space-y-2 text-sm text-purple-700">
                <li className="cursor-pointer hover:text-purple-900">• Comment suivre ma commande ?</li>
                <li className="cursor-pointer hover:text-purple-900">• Délais de livraison</li>
                <li className="cursor-pointer hover:text-purple-900">• Politique de retour</li>
                <li className="cursor-pointer hover:text-purple-900">• Modes de paiement</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </CustomerDashboardLayout>
  );
};
