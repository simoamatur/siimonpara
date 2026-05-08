/**
 * Automation Rule Form - Modern 2026 Professional Design
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import {
  Save, X, Plus, ArrowLeft, CheckCircle2, Bot, Calendar, Clock,
  Filter, Users, DollarSign, FileText, ChevronDown, Search,
  Zap, Settings, Mail, Bell, TrendingUp, AlertCircle, CheckSquare, Loader2
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
type ScheduleType = 'daily' | 'weekly' | 'monthly' | 'onDemand';
type CriteriaType = 'byDelivery' | 'byClient' | 'byDate' | 'byAmount';
type ActionType = 'generate' | 'send' | 'remind' | 'report';

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  schedule: ScheduleType;
  scheduleTime: string;
  scheduleDay?: number;
  criteria: {
    type: CriteriaType;
    minAmount?: number;
    maxAmount?: number;
    clientIds?: string[];
    dateFrom?: string;
    dateTo?: string;
    excludeInvoiced: boolean;
  };
  actions: ActionType[];
  emailNotification: boolean;
  includeReport: boolean;
  createdBy: string;
  createdAt: string;
}

const SCHEDULE_OPTIONS: { value: ScheduleType; label: string; icon: React.ReactNode }[] = [
  { value: 'daily', label: 'Quotidien', icon: <Clock size={18} /> },
  { value: 'weekly', label: 'Hebdomadaire', icon: <Calendar size={18} /> },
  { value: 'monthly', label: 'Mensuel', icon: <TrendingUp size={18} /> },
  { value: 'onDemand', label: 'Manuel', icon: <Zap size={18} /> },
];

const CRITERIA_OPTIONS: { value: CriteriaType; label: string; description: string }[] = [
  { value: 'byAmount', label: 'Par Montant', description: 'Facturer automatiquement les clients selon le montant cumulé' },
  { value: 'byClient', label: 'Par Client', description: 'Sélectionner des clients spécifiques' },
  { value: 'byDate', label: 'Par Date', description: 'Facturer les livraisons d\'une période donnée' },
  { value: 'byDelivery', label: 'Par Livraison', description: 'Facturer les BL non-facturés automatiquement' },
];

const ACTION_OPTIONS: { value: ActionType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'generate', label: 'Générer Factures', icon: <FileText size={16} />, description: 'Créer automatiquement les factures' },
  { value: 'send', label: 'Envoyer par Email', icon: <Mail size={16} />, description: 'Envoyer les factures aux clients' },
  { value: 'remind', label: 'Relances', icon: <Bell size={16} />, description: 'Envoyer des relances pour impayés' },
  { value: 'report', label: 'Rapport', icon: <TrendingUp size={16} />, description: 'Générer un rapport de facturation' },
];

const DAYS_OF_WEEK = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// ============================================
// MAIN COMPONENT
// ============================================
export const AutomationRuleFormModern: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState<AutomationRule>({
    id: '',
    name: '',
    description: '',
    isActive: true,
    schedule: 'monthly',
    scheduleTime: '08:00',
    scheduleDay: 1,
    criteria: {
      type: 'byAmount',
      minAmount: 5000,
      excludeInvoiced: true,
    },
    actions: ['generate', 'report'],
    emailNotification: true,
    includeReport: true,
    createdBy: '',
    createdAt: new Date().toISOString(),
  });

  const [activeStep, setActiveStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    axios.get('/api/clients', { params: { limit: 200 } }).then(res => {
      const data = res.data?.data || res.data || [];
      setClients(data.map((c: any) => ({ id: c.id, name: c.name || c.raisonSociale })));
    }).catch(() => {});
  }, []);

  const handleToggleClient = useCallback((clientId: string) => {
    setFormData(prev => ({
      ...prev,
      criteria: {
        ...prev.criteria,
        clientIds: prev.criteria.clientIds?.includes(clientId)
          ? prev.criteria.clientIds.filter(id => id !== clientId)
          : [...(prev.criteria.clientIds || []), clientId],
      },
    }));
  }, []);

  const handleToggleAction = useCallback((action: ActionType) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.includes(action)
        ? prev.actions.filter(a => a !== action)
        : [...prev.actions, action],
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.name.trim()) { toast('error', "Veuillez saisir un nom"); return; }
    setSaving(true);
    try {
      await axios.post('/api/regles-facturation', {
        nom: formData.name,
        jourMois: formData.scheduleDay || 1,
        condition: JSON.stringify({
          description: formData.description,
          schedule: formData.schedule,
          scheduleTime: formData.scheduleTime,
          criteria: formData.criteria,
          actions: formData.actions,
          emailNotification: formData.emailNotification,
          includeReport: formData.includeReport,
          createdBy: formData.createdBy,
        }),
        actif: formData.isActive,
      });
      navigate('/dashboard/vente/facture-auto');
    } catch (err) {
      console.error('Erreur création règle:', err);
      toast('error', "Erreur lors de la création de la règle");
    } finally {
      setSaving(false);
    }
  }, [formData, navigate]);

  const steps = [
    { id: 1, title: 'Général', icon: Settings },
    { id: 2, title: 'Planification', icon: Calendar },
    { id: 3, title: 'Critères', icon: Filter },
    { id: 4, title: 'Actions', icon: Zap },
  ];

  return (
    <DashboardLayout title="Nouvelle Règle d'Automatisation">
      <div className=" mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard/vente/facture-auto')} className="p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-violet-600 hover:border-violet-300 transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                <Bot size={28} className="text-violet-600" />
                Nouvelle Règle
              </h2>
              <p className="text-sm text-gray-400">Automatiser la facturation</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${formData.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
              {formData.isActive ? 'Active' : 'Inactive'}
            </span>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg font-medium shadow-lg shadow-violet-500/25 disabled:opacity-50">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Création...' : 'Créer Règle'}
            </motion.button>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <button key={step.id} onClick={() => setActiveStep(step.id)} className="flex items-center gap-3 group">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  activeStep === step.id ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/25' :
                  activeStep > step.id ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-slate-400'
                }`}>
                  {activeStep > step.id ? <CheckCircle2 size={20} /> : <step.icon size={20} />}
                </div>
                <div className="hidden md:block text-left">
                  <p className={`text-xs font-semibold uppercase ${activeStep === step.id ? 'text-violet-600' : 'text-slate-400'}`}>Étape {step.id}</p>
                  <p className={`font-medium ${activeStep === step.id ? 'text-gray-700' : 'text-slate-400'}`}>{step.title}</p>
                </div>
                {idx < steps.length - 1 && <div className={`w-12 md:w-24 h-0.5 mx-2 ${activeStep > step.id ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
              </button>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <motion.div key={activeStep} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Step 1: General */}
          {activeStep === 1 && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                  <Settings size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-700">Informations Générales</h3>
                  <p className="text-sm text-gray-400">Nom et description de la règle</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Nom de la règle *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Facturation Mensuelle Grands Clients"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    placeholder="Décrivez le but de cette règle d'automatisation..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 resize-none"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-600">Activer la règle</p>
                    <p className="text-sm text-gray-400">La règle s'exécutera selon la planification</p>
                  </div>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                    className={`w-14 h-7 rounded-full transition-colors ${formData.isActive ? 'bg-violet-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${formData.isActive ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {activeStep === 2 && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-700">Planification</h3>
                  <p className="text-sm text-gray-400">Quand cette règle doit-elle s'exécuter ?</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SCHEDULE_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    onClick={() => setFormData(prev => ({ ...prev, schedule: option.value }))}
                    className={`flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      formData.schedule === option.value ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white hover:border-violet-300'
                    }`}
                  >
                    <div className={`p-3 rounded-lg ${formData.schedule === option.value ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {option.icon}
                    </div>
                    <span className={`font-medium ${formData.schedule === option.value ? 'text-violet-700' : 'text-gray-500'}`}>{option.label}</span>
                  </button>
                ))}
              </div>

              {formData.schedule !== 'onDemand' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Heure d'exécution</label>
                    <input
                      type="time"
                      value={formData.scheduleTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, scheduleTime: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                    />
                  </div>
                  {formData.schedule === 'weekly' && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-2 block">Jour de la semaine</label>
                      <select
                        value={formData.scheduleDay}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduleDay: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                      >
                        {DAYS_OF_WEEK.map((day, idx) => <option key={idx} value={idx}>{day}</option>)}
                      </select>
                    </div>
                  )}
                  {formData.schedule === 'monthly' && (
                    <div>
                      <label className="text-sm font-semibold text-gray-600 mb-2 block">Jour du mois</label>
                      <select
                        value={formData.scheduleDay}
                        onChange={(e) => setFormData(prev => ({ ...prev, scheduleDay: parseInt(e.target.value) }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                      >
                        {Array.from({ length: 28 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Criteria */}
          {activeStep === 3 && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                  <Filter size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-700">Critères de Sélection</h3>
                  <p className="text-sm text-gray-400">Quelles factures doivent être générées ?</p>
                </div>
              </div>

              <div className="space-y-3">
                {CRITERIA_OPTIONS.map(criteria => (
                  <button
                    key={criteria.value}
                    onClick={() => setFormData(prev => ({ ...prev, criteria: { ...prev.criteria, type: criteria.value } }))}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      formData.criteria.type === criteria.value ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white hover:border-violet-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        formData.criteria.type === criteria.value ? 'border-violet-500 bg-violet-500' : 'border-slate-300'
                      }`}>
                        {formData.criteria.type === criteria.value && <CheckCircle2 size={14} className="text-white" />}
                      </div>
                      <div>
                        <p className={`font-semibold ${formData.criteria.type === criteria.value ? 'text-violet-700' : 'text-gray-600'}`}>{criteria.label}</p>
                        <p className="text-sm text-gray-400">{criteria.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {formData.criteria.type === 'byAmount' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Montant Minimum (DH)</label>
                    <input
                      type="number"
                      value={formData.criteria.minAmount}
                      onChange={(e) => setFormData(prev => ({ ...prev, criteria: { ...prev.criteria, minAmount: parseFloat(e.target.value) } }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Montant Maximum (DH)</label>
                    <input
                      type="number"
                      value={formData.criteria.maxAmount || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, criteria: { ...prev.criteria, maxAmount: parseFloat(e.target.value) } }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                      placeholder="Illimité"
                    />
                  </div>
                </div>
              )}

              {formData.criteria.type === 'byClient' && (
                <div className="mt-4">
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Sélectionner les clients</label>
                  <div className="grid grid-cols-2 gap-2">
                    {clients.map(client => (
                      <button
                        key={client.id}
                        onClick={() => handleToggleClient(client.id)}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                          formData.criteria.clientIds?.includes(client.id) ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          formData.criteria.clientIds?.includes(client.id) ? 'bg-violet-500 border-violet-500' : 'border-slate-300'
                        }`}>
                          {formData.criteria.clientIds?.includes(client.id) && <CheckSquare size={12} className="text-white" />}
                        </div>
                        <span className={`font-medium ${formData.criteria.clientIds?.includes(client.id) ? 'text-violet-700' : 'text-gray-600'}`}>{client.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg mt-4">
                <input
                  type="checkbox"
                  checked={formData.criteria.excludeInvoiced}
                  onChange={(e) => setFormData(prev => ({ ...prev, criteria: { ...prev.criteria, excludeInvoiced: e.target.checked } }))}
                  className="w-5 h-5 rounded border-slate-300 text-violet-500"
                />
                <div>
                  <p className="font-medium text-gray-600">Exclure les livraisons déjà facturées</p>
                  <p className="text-sm text-gray-400">Ne pas inclure les BL qui ont déjà une facture</p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Actions */}
          {activeStep === 4 && (
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-700">Actions à Exécuter</h3>
                  <p className="text-sm text-gray-400">Que doit faire cette règle ?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ACTION_OPTIONS.map(action => (
                  <button
                    key={action.value}
                    onClick={() => handleToggleAction(action.value)}
                    className={`flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                      formData.actions.includes(action.value) ? 'border-violet-500 bg-violet-50' : 'border-gray-200 bg-white hover:border-violet-300'
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${formData.actions.includes(action.value) ? 'bg-violet-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                      {action.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold ${formData.actions.includes(action.value) ? 'text-violet-700' : 'text-gray-600'}`}>{action.label}</p>
                        {formData.actions.includes(action.value) && <CheckCircle2 size={18} className="text-violet-500" />}
                      </div>
                      <p className="text-sm text-gray-400">{action.description}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail size={18} className="text-slate-400" />
                    <div>
                      <p className="font-medium text-gray-600">Notification Email</p>
                      <p className="text-sm text-gray-400">Envoyer un email après exécution</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, emailNotification: !prev.emailNotification }))}
                    className={`w-14 h-7 rounded-full transition-colors ${formData.emailNotification ? 'bg-violet-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${formData.emailNotification ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText size={18} className="text-slate-400" />
                    <div>
                      <p className="font-medium text-gray-600">Inclure un Rapport</p>
                      <p className="text-sm text-gray-400">Générer un récapitulatif PDF</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, includeReport: !prev.includeReport }))}
                    className={`w-14 h-7 rounded-full transition-colors ${formData.includeReport ? 'bg-violet-500' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform ${formData.includeReport ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
            disabled={activeStep === 1}
            className="px-6 py-3 bg-white border border-gray-200 text-gray-500 rounded-lg font-medium disabled:opacity-50 hover:border-slate-300"
          >
            Précédent
          </button>
          {activeStep < 4 ? (
            <button
              onClick={() => setActiveStep(activeStep + 1)}
              className="px-6 py-3 bg-violet-500 text-white rounded-lg font-medium hover:bg-violet-600"
            >
              Suivant
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg font-medium shadow-lg shadow-violet-500/25 disabled:opacity-50"
            >
              {saving ? 'Création...' : 'Créer la Règle'}
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
