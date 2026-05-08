/**
 * Facture Automatique - Modern 2026 Professional ERP Design
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';
import axios from 'axios';
import {
  Play, Pause, Settings, Calendar, Clock, CheckCircle2, XCircle, AlertCircle,
  FileText, Zap, RotateCcw, TrendingUp, Users, Package, DollarSign, Filter,
  ChevronLeft, ChevronRight, Eye, Download, Trash2, Plus, Bot, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// TYPES
// ============================================
type AutomationStatus = 'active' | 'paused' | 'completed' | 'failed' | 'draft';
type ScheduleType = 'daily' | 'weekly' | 'monthly' | 'onDemand';
type CriteriaType = 'byDelivery' | 'byClient' | 'byDate' | 'byAmount';

interface AutomationCriteria {
  type: CriteriaType;
  minAmount?: number;
  maxAmount?: number;
  clientIds?: string[];
  dateFrom?: string;
  dateTo?: string;
  deliveryIds?: string[];
  excludeDelivered?: boolean;
}

interface AutomationRule {
  id: string;
  name: string;
  description: string;
  status: AutomationStatus;
  schedule: ScheduleType;
  criteria: AutomationCriteria;
  lastRun?: string;
  nextRun?: string;
  runCount: number;
  invoicesGenerated: number;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface AutomationRun {
  id: string;
  ruleId: string;
  ruleName: string;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  startTime: string;
  endTime?: string;
  invoicesGenerated: number;
  errors: string[];
  details: {
    clientId: string;
    clientName: string;
    deliveryIds: string[];
    amount: number;
    invoiceNumber?: string;
  }[];
}



// ============================================
// UTILITY COMPONENTS
// ============================================
const StatusBadge: React.FC<{ status: AutomationStatus }> = ({ status }) => {
  const configs: Record<AutomationStatus, { label: string; color: string; icon: React.ReactNode }> = {
    active: { label: 'Active', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <Zap size={14} /> },
    paused: { label: 'En pause', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <Pause size={14} /> },
    completed: { label: 'Terminée', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <CheckCircle2 size={14} /> },
    failed: { label: 'Échouée', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: <XCircle size={14} /> },
    draft: { label: 'Brouillon', color: 'bg-gray-50 text-gray-500 border-gray-200', icon: <Clock size={14} /> },
  };
  const config = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

const ScheduleBadge: React.FC<{ schedule: ScheduleType }> = ({ schedule }) => {
  const labels: Record<ScheduleType, string> = {
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    onDemand: 'Manuel',
  };
  const colors: Record<ScheduleType, string> = {
    daily: 'bg-cyan-50 text-cyan-600 border-cyan-200',
    weekly: 'bg-violet-50 text-violet-600 border-violet-200',
    monthly: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    onDemand: 'bg-gray-50 text-gray-500 border-gray-200',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colors[schedule]}`}>
      <Calendar size={12} className="mr-1" />
      {labels[schedule]}
    </span>
  );
};

const CriteriaBadge: React.FC<{ type: CriteriaType }> = ({ type }) => {
  const labels: Record<CriteriaType, string> = {
    byDelivery: 'Par Livraison',
    byClient: 'Par Client',
    byDate: 'Par Date',
    byAmount: 'Par Montant',
  };
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
      <Filter size={12} className="mr-1" />
      {labels[type]}
    </span>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
interface RuleFromAPI { id: string; nom: string; jourMois: number; condition?: string; actif: boolean; createdAt: string; updatedAt: string }

const mapRule = (r: RuleFromAPI): AutomationRule => {
  let cond: any = {};
  try { cond = r.condition ? JSON.parse(r.condition) : {}; } catch { cond = {}; }
  return {
    id: r.id,
    name: r.nom,
    description: cond.description || '',
    status: r.actif ? 'active' : 'paused',
    schedule: cond.schedule || 'monthly',
    criteria: cond.criteria || { type: 'byAmount', minAmount: 5000, excludeDelivered: true },
    lastRun: cond.lastRun || undefined,
    nextRun: cond.nextRun || undefined,
    runCount: cond.runCount || 0,
    invoicesGenerated: cond.invoicesGenerated || 0,
    totalAmount: cond.totalAmount || 0,
    createdBy: cond.createdBy || 'Admin',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
};

export const FactureAutoModern: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [activeTab, setActiveTab] = useState<'rules' | 'runs' | 'new'>('rules');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AutomationStatus | 'all'>('all');
  const [selectedRun, setSelectedRun] = useState<AutomationRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRules = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/regles-facturation');
        const data: RuleFromAPI[] = res.data?.data || res.data || [];
        setRules(data.map(mapRule));
      } catch (err) {
        console.error('Erreur chargement règles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  // Stats
  const stats = useMemo(() => {
    return {
      totalRules: rules.length,
      activeRules: rules.filter(r => r.status === 'active').length,
      totalRuns: runs.length,
      totalInvoices: rules.reduce((acc, r) => acc + r.invoicesGenerated, 0),
      totalAmount: rules.reduce((acc, r) => acc + r.totalAmount, 0),
      lastRun: runs.length > 0 ? runs[0].startTime : null,
    };
  }, [rules, runs]);

  // Filtered rules
  const filteredRules = useMemo(() => {
    let result = [...rules];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }
    return result;
  }, [rules, searchQuery, statusFilter]);

  const handleToggleStatus = useCallback(async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    try {
      await axios.put(`/api/regles-facturation/${id}`, { actif: rule.status !== 'active' });
      setRules(prev => prev.map(r => {
        if (r.id !== id) return r;
        const newStatus = r.status === 'active' ? 'paused' : 'active';
        return { ...r, status: newStatus as AutomationStatus, updatedAt: new Date().toISOString() };
      }));
    } catch (err) {
      console.error('Erreur changement statut:', err);
    }
  }, [rules]);

  const handleRunNow = useCallback((rule: AutomationRule) => {
    const newRun: AutomationRun = {
      id: `r${Date.now()}`,
      ruleId: rule.id,
      ruleName: rule.name,
      status: 'running',
      startTime: new Date().toISOString(),
      invoicesGenerated: 0,
      errors: [],
      details: [],
    };
    setRuns(prev => [newRun, ...prev]);
    setTimeout(() => {
      setRuns(prev => prev.map(r => {
        if (r.id !== newRun.id) return r;
        return {
          ...r,
          status: 'completed',
          endTime: new Date().toISOString(),
          invoicesGenerated: Math.floor(Math.random() * 5) + 1,
          details: [
            { clientId: '', clientName: 'Test Client', deliveryIds: ['BL-TEST'], amount: Math.random() * 1000, invoiceNumber: `FAC-${Date.now()}` },
          ],
        };
      }));
      setRules(prev => prev.map(r => {
        if (r.id !== rule.id) return r;
        return { ...r, lastRun: new Date().toISOString(), runCount: r.runCount + 1, invoicesGenerated: r.invoicesGenerated + Math.floor(Math.random() * 5) + 1 };
      }));
    }, 3000);
  }, []);

  const handleDeleteRule = useCallback(async (id: string) => {
    if (!(await confirm({ message: 'Êtes-vous sûr de vouloir supprimer cette règle ?'}))) return;
    try {
      await axios.delete(`/api/regles-facturation/${id}`);
      setRules(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Erreur suppression:', err);
    }
  }, []);

  // Render Rules List
  const renderRules = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Règles Total', value: stats.totalRules, icon: Settings, color: 'from-slate-500 to-gray-500' },
          { label: 'Actives', value: stats.activeRules, icon: Zap, color: 'from-emerald-500 to-teal-500' },
          { label: 'Exécutions', value: stats.totalRuns, icon: RotateCcw, color: 'from-blue-500 to-cyan-500' },
          { label: 'Factures Générées', value: stats.totalInvoices, icon: FileText, color: 'from-violet-500 to-purple-500' },
          { label: 'Montant Total', value: `${stats.totalAmount.toLocaleString('fr-FR')} DH`, icon: DollarSign, color: 'from-amber-500 to-orange-500' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4"
          >
            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full`} />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-400 dark:text-gray-400 font-medium">{stat.label}</p>
                <p className="text-lg font-bold text-gray-700 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}>
                <stat.icon size={16} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher règle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="px-4 py-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as AutomationStatus | 'all')}
            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actives</option>
            <option value="paused">En pause</option>
            <option value="draft">Brouillons</option>
          </select>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/dashboard/vente/facture-auto/nouvelle-regle')}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg font-medium shadow-lg shadow-violet-500/25"
        >
          <Plus size={18} />
          Nouvelle Règle
        </motion.button>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredRules.map((rule, index) => (
          <motion.div
            key={rule.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-700">{rule.name}</h3>
                  <p className="text-xs text-gray-400">{rule.description}</p>
                </div>
              </div>
              <StatusBadge status={rule.status} />
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <ScheduleBadge schedule={rule.schedule} />
              <CriteriaBadge type={rule.criteria.type} />
            </div>

            <div className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg mb-4">
              <div>
                <p className="text-xs text-gray-400">Exécutions</p>
                <p className="font-bold text-gray-700">{rule.runCount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Factures</p>
                <p className="font-bold text-gray-700">{rule.invoicesGenerated}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Montant</p>
                <p className="font-bold text-gray-700">{rule.totalAmount.toLocaleString('fr-FR')} DH</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">
                {rule.lastRun && <p>Dernière: {new Date(rule.lastRun).toLocaleDateString('fr-FR')}</p>}
                {rule.nextRun && <p>Prochaine: {new Date(rule.nextRun).toLocaleDateString('fr-FR')}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleToggleStatus(rule.id)}
                  className={`p-2 rounded-lg transition-colors ${
                    rule.status === 'active' ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                  }`}
                  title={rule.status === 'active' ? 'Mettre en pause' : 'Activer'}
                >
                  {rule.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button
                  onClick={() => handleRunNow(rule)}
                  className="p-2 rounded-lg bg-violet-100 text-violet-600 hover:bg-violet-200"
                  title="Exécuter maintenant"
                >
                  <Zap size={18} />
                </button>
                <button
                  onClick={() => handleDeleteRule(rule.id)}
                  className="p-2 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-200"
                  title="Supprimer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Render Runs History
  const renderRuns = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-700">Historique des exécutions</h2>
        <button
          onClick={() => setActiveTab('rules')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-500 hover:text-emerald-600"
        >
          <ChevronLeft size={18} />
          Retour aux règles
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Date/Heure</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400">Règle</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400">Statut</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400">Factures</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400">Durée</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {runs.map((run) => {
              const duration = run.endTime 
                ? Math.round((new Date(run.endTime).getTime() - new Date(run.startTime).getTime()) / 1000)
                : null;
              
              return (
                <tr key={run.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(run.startTime).toLocaleString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-700">{run.ruleName}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                      run.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                      run.status === 'running' ? 'bg-blue-100 text-blue-600' :
                      run.status === 'failed' ? 'bg-rose-100 text-rose-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {run.status === 'completed' ? 'Terminé' :
                       run.status === 'running' ? 'En cours' :
                       run.status === 'failed' ? 'Échoué' : 'Annulé'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-700">
                    {run.invoicesGenerated}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-500">
                    {duration ? `${duration}s` : '-'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => setSelectedRun(run)}
                      className="p-1.5 rounded hover:bg-gray-100 text-slate-400 hover:text-emerald-600"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render New Rule Form
  const [newRuleForm, setNewRuleForm] = useState({ nom: '', description: '', schedule: 'monthly', critere: 'byAmount' });
  const [creating, setCreating] = useState(false);

  const handleCreateRule = useCallback(async () => {
    if (!newRuleForm.nom.trim()) { toast('error', 'Veuillez saisir un nom'); return; }
    setCreating(true);
    try {
      await axios.post('/api/regles-facturation', {
        nom: newRuleForm.nom,
        jourMois: 1,
        condition: JSON.stringify({
          description: newRuleForm.description,
          schedule: newRuleForm.schedule,
          criteria: { type: newRuleForm.critere, minAmount: 5000, excludeDelivered: true },
          runCount: 0, invoicesGenerated: 0, totalAmount: 0,
        }),
        actif: true,
      });
      setNewRuleForm({ nom: '', description: '', schedule: 'monthly', critere: 'byAmount' });
      // Refresh rules list
      const res = await axios.get('/api/regles-facturation');
      const data: RuleFromAPI[] = res.data?.data || res.data || [];
      setRules(data.map(mapRule));
      setActiveTab('rules');
    } catch (err) {
      console.error('Erreur création règle:', err);
      toast('error', 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  }, [newRuleForm]);

  const renderNewRule = () => (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => setActiveTab('rules')}
          className="p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-emerald-600"
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-xl font-bold text-gray-700">Nouvelle Règle d'Automatisation</h2>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Nom de la règle</label>
          <input
            type="text"
            value={newRuleForm.nom}
            onChange={e => setNewRuleForm(prev => ({ ...prev, nom: e.target.value }))}
            placeholder="Ex: Facturation Mensuelle - Grands Clients"
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">Description</label>
          <textarea
            value={newRuleForm.description}
            onChange={e => setNewRuleForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Description détaillée de la règle..."
            className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 h-24"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Planification</label>
            <select
              value={newRuleForm.schedule}
              onChange={e => setNewRuleForm(prev => ({ ...prev, schedule: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="daily">Quotidienne</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuelle</option>
              <option value="onDemand">Manuelle</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">Critère</label>
            <select
              value={newRuleForm.critere}
              onChange={e => setNewRuleForm(prev => ({ ...prev, critere: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="byAmount">Par Montant</option>
              <option value="byClient">Par Client</option>
              <option value="byDate">Par Date</option>
              <option value="byDelivery">Par Livraison</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            onClick={() => setActiveTab('rules')}
            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleCreateRule}
            disabled={creating}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg font-medium disabled:opacity-50"
          >
            {creating ? 'Création...' : 'Créer la règle'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Facturation Automatique">
      <div className="mb-6">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'rules' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Règles ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('runs')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'runs' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Historique ({runs.length})
          </button>
          <button
            onClick={() => setActiveTab('new')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'new' ? 'bg-white text-violet-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            + Nouvelle
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'rules' && (loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-violet-500" />
          </div>
        ) : renderRules())}
        {activeTab === 'runs' && renderRuns()}
        {activeTab === 'new' && renderNewRule()}
      </AnimatePresence>
    </DashboardLayout>
  );
};
