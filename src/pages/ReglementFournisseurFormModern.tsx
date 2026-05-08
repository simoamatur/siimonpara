/**
 * Règlement Fournisseur Form - Modern 2026 Professional Design
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { DashboardLayout } from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, X, Plus, Trash2, ArrowLeft, CheckCircle2, Building2, Hash,
  Calendar, DollarSign, Search, ChevronDown, Printer, Receipt,
  Calculator, AlertCircle, FileText, User, CreditCard, Banknote,
  Clock, Barcode, GripVertical, Percent, Wallet, ArrowRightLeft,
  Landmark, QrCode, FileCheck, Loader2
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
type PaymentStatus = 'draft' | 'pending' | 'paid' | 'cancelled';
type PaymentMode = 'cash' | 'check' | 'transfer' | 'card' | 'direct_debit';

interface PaymentLine {
  id: string;
  lineNumber: number;
  invoiceRef: string;
  invoiceDate: string;
  originalAmount: number;
  remainingAmount: number;
  amountToPay: number;
  discountAmount: number;
  finalAmount: number;
}

interface ReglementFournisseur {
  id: string;
  number: string;
  date: string;
  supplierCode: string;
  supplierName: string;
  supplierAddress?: string;
  supplierPhone?: string;
  status: PaymentStatus;
  paymentMode: PaymentMode;
  bankReference?: string;
  checkNumber?: string;
  totalAmount: number;
  discountTotal: number;
  netAmount: number;
  lines: PaymentLine[];
  observation?: string;
  commercial: string;
  createdBy: string;
  createdAt: string;
}

// ============================================
// API TYPES
// ============================================
interface FournisseurItem { id: string; code: string; name: string; raisonSociale?: string; phone?: string }
interface FactureAchatItem { id: string; reference: string; date: string; totalTTC: number; statut: string }
interface ModeReglement { id: string; nom: string }

// ============================================
// UI CONSTANTS
// ============================================
const PAYMENT_MODES: { value: PaymentMode; label: string; icon: React.ReactNode }[] = [
  { value: 'cash', label: 'Espèces', icon: <Banknote size={16} /> },
  { value: 'check', label: 'Chèque', icon: <FileCheck size={16} /> },
  { value: 'transfer', label: 'Virement', icon: <ArrowRightLeft size={16} /> },
  { value: 'card', label: 'Carte Bancaire', icon: <CreditCard size={16} /> },
  { value: 'direct_debit', label: 'Prélèvement', icon: <Landmark size={16} /> },
];

// ============================================
// UTILITY COMPONENTS
// ============================================
const StatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const configs: Record<PaymentStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <Clock size={14} /> },
    pending: { label: 'En Attente', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <AlertCircle size={14} /> },
    paid: { label: 'Payé', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle2 size={14} /> },
    cancelled: { label: 'Annulé', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: <X size={14} /> },
  };
  const config = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export const ReglementFournisseurFormModern: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<ReglementFournisseur>({
    id: '',
    number: 'RF-2026-001',
    date: new Date().toISOString().split('T')[0],
    supplierCode: '',
    supplierName: '',
    supplierAddress: '',
    supplierPhone: '',
    status: 'draft',
    paymentMode: 'transfer',
    totalAmount: 0,
    discountTotal: 0,
    netAmount: 0,
    lines: [],
    observation: '',
    commercial: 'Agent1',
    createdBy: 'Mohamed Admin',
    createdAt: new Date().toISOString(),
  });

  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'lines' | 'totals' | 'notes'>('lines');
  const [showInvoiceDropdown, setShowInvoiceDropdown] = useState(false);

  const [fournisseurs, setFournisseurs] = useState<FournisseurItem[]>([]);
  const [facturesAchat, setFacturesAchat] = useState<FactureAchatItem[]>([]);
  const [modesReglement, setModesReglement] = useState<ModeReglement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fRes, facRes, mRes] = await Promise.all([
          axios.get('/api/parametres/fournisseurs', { params: { limit: 200 } }),
          axios.get('/api/achat/factures', { params: { limit: 200 } }),
          axios.get('/api/parametres/modes-reglement'),
        ]);
        setFournisseurs(fRes.data?.data || fRes.data || []);
        setFacturesAchat(facRes.data?.data || facRes.data || []);
        setModesReglement(mRes.data?.data || mRes.data || []);
      } catch (err) {
        console.error('Erreur chargement données:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totals = useMemo(() => {
    const totalAmount = formData.lines.reduce((sum, line) => sum + line.finalAmount, 0);
    const discountTotal = formData.lines.reduce((sum, line) => sum + line.discountAmount, 0);
    const netAmount = totalAmount;
    return { totalAmount, discountTotal, netAmount };
  }, [formData.lines]);

  const handleSelectSupplier = useCallback((supplier: FournisseurItem) => {
    setFormData(prev => ({
      ...prev,
      supplierCode: supplier.id,
      supplierName: supplier.name || supplier.raisonSociale || '',
      supplierPhone: supplier.phone || '',
    }));
    setShowSupplierDropdown(false);
    setSupplierSearch('');
  }, []);

  const handleAddInvoice = useCallback((invoice: FactureAchatItem) => {
    const existing = formData.lines.find(l => l.invoiceRef === invoice.id);
    if (existing) { toast('error', "Facture déjà ajoutée"); return; }
    const newLine: PaymentLine = {
      id: Date.now().toString(),
      lineNumber: formData.lines.length + 1,
      invoiceRef: invoice.id,
      invoiceDate: invoice.date,
      originalAmount: invoice.totalTTC,
      remainingAmount: invoice.totalTTC,
      amountToPay: invoice.totalTTC,
      discountAmount: 0,
      finalAmount: invoice.totalTTC,
    };
    setFormData(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
    setShowInvoiceDropdown(false);
  }, [formData.lines]);

  const handleUpdateLine = useCallback((id: string, field: keyof PaymentLine, value: any) => {
    setFormData(prev => {
      const updatedLines = prev.lines.map(line => {
        if (line.id !== id) return line;
        const updatedLine = { ...line, [field]: value };
        
        if (field === 'amountToPay' || field === 'discountAmount') {
          updatedLine.finalAmount = updatedLine.amountToPay - updatedLine.discountAmount;
        }
        
        return updatedLine;
      });
      return { ...prev, lines: updatedLines };
    });
  }, []);

  const handleDeleteLine = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.filter(l => l.id !== id).map((l, i) => ({ ...l, lineNumber: i + 1 })),
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!formData.supplierCode) { toast('error', "Veuillez sélectionner un fournisseur"); return; }
    if (!formData.lines.length) { toast('error', "Veuillez ajouter au moins une facture"); return; }
    setSaving(true);
    try {
      await axios.post('/api/achat/reglements', {
        fournisseurId: formData.supplierCode,
        montant: formData.netAmount || formData.totalAmount,
        modePaiementId: formData.paymentMode === 'check' ? modesReglement.find(m => m.nom?.toLowerCase().includes('chèque'))?.id || undefined : undefined,
        referenceChèque: formData.checkNumber || undefined,
        items: formData.lines.map(l => ({
          factureId: l.invoiceRef,
          montantApplique: l.finalAmount || l.amountToPay,
        })),
      });
      navigate('/dashboard/achat/reglements');
    } catch (err) {
      console.error('Erreur création règlement:', err);
      toast('error', "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  }, [formData, navigate, modesReglement]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return fournisseurs;
    return fournisseurs.filter(s => 
      (s.name || s.raisonSociale || '').toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(supplierSearch.toLowerCase())
    );
  }, [supplierSearch, fournisseurs]);

  const availableInvoices = useMemo(() => {
    const selectedRefs = formData.lines.map(l => l.invoiceRef);
    return facturesAchat
      .filter(f => f.statut !== 'payée' && !selectedRefs.includes(f.id))
      .map(f => ({ ref: f.id, date: f.date, original: f.totalTTC, remaining: f.totalTTC }));
  }, [facturesAchat, formData.lines]);

  return (
    <DashboardLayout title="Nouveau Règlement Fournisseur">
      <div className=" mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/achat/reglements')}
              className="p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-cyan-600 hover:border-cyan-300 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                <Wallet size={28} className="text-cyan-600" />
                Nouveau Règlement Fournisseur
              </h2>
              <p className="text-sm text-gray-400">Paiement des factures fournisseurs</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={formData.status} />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFormData(prev => ({ ...prev, status: 'pending' }))}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-700 rounded-lg font-medium hover:bg-cyan-200"
            >
              <CreditCard size={18} />
              Payer
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-lg shadow-cyan-500/25 ${saving || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white'}`}
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </motion.button>
          </div>
        </motion.div>

        {/* Main Form Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden"
        >
          {/* Document Header */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">N° Règlement</label>
                <input type="text" value={formData.number} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg font-mono font-semibold text-gray-600" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Date Règlement</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Mode de Paiement</label>
                <select value={formData.paymentMode} onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value as PaymentMode }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20">
                  {PAYMENT_MODES.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Référence Bancaire</label>
                <input type="text" value={formData.bankReference || ''} onChange={(e) => setFormData(prev => ({ ...prev, bankReference: e.target.value }))} placeholder="Réf. bancaire..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20" />
              </div>
            </div>
            {formData.paymentMode === 'check' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-gray-200">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400 uppercase">N° Chèque</label>
                  <input type="text" value={formData.checkNumber || ''} onChange={(e) => setFormData(prev => ({ ...prev, checkNumber: e.target.value }))} placeholder="Numéro du chèque..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20" />
                </div>
              </div>
            )}
          </div>

          {/* Supplier Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={20} className="text-cyan-600" />
              <h3 className="font-bold text-gray-700">Informations Fournisseur</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative">
                <label className="text-xs font-semibold text-gray-400">Code Fournisseur *</label>
                <div className="relative">
                  <input type="text" value={formData.supplierCode} onClick={() => setShowSupplierDropdown(true)} readOnly placeholder="Sélectionner fournisseur..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer focus:ring-2 focus:ring-cyan-500/20" />
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <AnimatePresence>
                  {showSupplierDropdown && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" autoFocus placeholder="Rechercher..." value={supplierSearch} onChange={(e) => setSupplierSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                        </div>
                      </div>
                      {filteredSuppliers.map(supplier => (
                        <button key={supplier.id || supplier.code} onClick={() => handleSelectSupplier(supplier)} className="w-full px-4 py-3 text-left hover:bg-cyan-50 border-b last:border-0">
                          <p className="font-medium text-gray-700">{supplier.name || supplier.raisonSociale}</p>
                          <p className="text-xs text-gray-400">{supplier.code} • {supplier.phone}</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Nom Fournisseur</label>
                <input type="text" value={formData.supplierName} readOnly className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Adresse</label>
                <input type="text" value={formData.supplierAddress || ''} readOnly className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Téléphone</label>
                <input type="text" value={formData.supplierPhone || ''} readOnly className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'lines', label: 'Factures à Régler', icon: Receipt },
                { id: 'totals', label: 'Totaux', icon: Calculator },
                { id: 'notes', label: 'Observations', icon: FileText },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'text-cyan-600 border-b-2 border-cyan-500 bg-cyan-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                  <tab.icon size={16} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'lines' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Invoice Search Bar */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 mb-2">Sélectionnez les factures à régler</p>
                    </div>
                    <div className="relative">
                      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowInvoiceDropdown(!showInvoiceDropdown)} className="flex items-center gap-2 px-4 py-3 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 shadow-sm">
                        <Plus size={20} />
                        <span>Ajouter Facture</span>
                      </motion.button>
                      <AnimatePresence>
                        {showInvoiceDropdown && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 right-0 mt-2 w-96 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                            <div className="p-3 border-b border-gray-100 bg-gray-50">
                              <p className="text-xs font-semibold text-gray-400 uppercase">Factures impayées</p>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {availableInvoices.map(invoice => (
                                <button key={invoice.ref} onClick={() => handleAddInvoice(invoice)} className="w-full px-4 py-3 text-left hover:bg-cyan-50 border-b border-gray-100 last:border-0">
                                  <div className="flex justify-between items-center">
                                    <div>
                                      <p className="font-medium text-gray-700">{invoice.ref}</p>
                                      <p className="text-xs text-gray-400">{invoice.date}</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-semibold text-gray-700">{invoice.remaining.toFixed(2)} DH</p>
                                      <p className="text-xs text-slate-400">Restant</p>
                                    </div>
                                  </div>
                                </button>
                              ))}
                              {availableInvoices.length === 0 && (
                                <p className="px-4 py-3 text-sm text-gray-400 text-center">Aucune facture disponible</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Lines Table */}
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-8"></th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Facture</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Date</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Montant Orig.</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Restant</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">À Payer</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Remise</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Final</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-12">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.lines.map((line, idx) => (
                        <motion.tr key={line.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="hover:bg-gray-50 group">
                          <td className="px-2 py-3"><div className="text-slate-300 group-hover:text-slate-400 cursor-move"><GripVertical size={16} /></div></td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Receipt size={16} className="text-cyan-600" />
                              <span className="font-medium text-gray-700">{line.invoiceRef}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-500">{line.invoiceDate}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-500">{line.originalAmount.toFixed(2)} DH</td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-700">{line.remainingAmount.toFixed(2)} DH</td>
                          <td className="px-2 py-3"><div className="relative"><input type="number" step="0.01" value={line.amountToPay} onChange={(e) => handleUpdateLine(line.id, 'amountToPay', parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1.5 text-sm text-right bg-white border border-gray-200 rounded-lg focus:border-cyan-500 focus:outline-none pr-6" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">DH</span></div></td>
                          <td className="px-2 py-3"><div className="relative"><input type="number" step="0.01" value={line.discountAmount} onChange={(e) => handleUpdateLine(line.id, 'discountAmount', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1.5 text-sm text-right bg-white border border-gray-200 rounded-lg focus:border-cyan-500 focus:outline-none pr-6" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">DH</span></div></td>
                          <td className="px-4 py-3 text-right"><span className="text-sm font-bold text-cyan-600">{line.finalAmount.toFixed(2)} DH</span></td>
                          <td className="px-2 py-3 text-center"><button onClick={() => handleDeleteLine(line.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button></td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {formData.lines.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center"><Receipt size={32} className="text-slate-300" /></div>
                    <p className="text-gray-400 font-medium">Aucune facture sélectionnée</p>
                    <p className="text-sm text-slate-400 mt-1">Ajoutez des factures à régler</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'totals' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-cyan-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Calculator size={18} className="text-cyan-600" />Récapitulatif du Règlement</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-cyan-100"><span className="text-gray-500">Total Factures</span><span className="font-semibold text-gray-700">{totals.totalAmount.toFixed(2)} DH</span></div>
                    <div className="flex justify-between items-center py-2 border-b border-cyan-100"><span className="text-gray-500">Remises Accordées</span><span className="font-semibold text-rose-600">-{totals.discountTotal.toFixed(2)} DH</span></div>
                    <div className="flex justify-between items-center py-2"><span className="text-lg font-semibold text-gray-700">Net à Payer</span><span className="text-2xl font-bold text-cyan-600">{totals.netAmount.toFixed(2)} DH</span></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                        <Wallet size={20} className="text-cyan-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Mode de Paiement</p>
                        <p className="font-semibold text-gray-700">{PAYMENT_MODES.find(m => m.value === formData.paymentMode)?.label}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <CheckCircle2 size={20} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Statut</p>
                        <p className="font-semibold text-gray-700">{formData.status === 'paid' ? 'Payé' : 'En Attente'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Observations</label>
                  <textarea value={formData.observation || ''} onChange={(e) => setFormData(prev => ({ ...prev, observation: e.target.value }))} rows={6} placeholder="Notes et observations concernant ce règlement..." className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20 resize-none" />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};
