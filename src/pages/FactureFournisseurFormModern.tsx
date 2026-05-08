/**
 * Facture Fournisseur Form - Modern 2026 Professional Design
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save, X, Plus, Trash2, ArrowLeft, CheckCircle2, Building2, Hash,
  Calendar, Package, DollarSign, Search, ChevronDown, Printer, Copy,
  Calculator, TrendingUp, Loader2, AlertCircle, FileText, User, Truck,
  Clock, Barcode, Camera, GripVertical, ScanLine, Percent, Receipt,
  Warehouse, Store, CreditCard
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
type InvoiceStatus = 'draft' | 'received' | 'validated' | 'paid' | 'partial' | 'cancelled';
type PaymentMode = 'cash' | 'check' | 'transfer' | 'credit';

interface InvoiceLine {
  id: string;
  lineNumber: number;
  depot: string;
  code: string;
  designation: string;
  description?: string;
  quantity: number;
  unit: string;
  puHT: number;
  remise: number;
  remise2: number;
  tva: number;
  puTTC: number;
  totalHT: number;
  totalTTC: number;
  receptionRef?: string;
}

interface FactureFournisseur {
  id: string;
  number: string;
  supplierInvoiceNumber?: string;
  date: string;
  dueDate: string;
  receptionDate: string;
  supplierCode: string;
  supplierName: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  status: InvoiceStatus;
  paymentMode: PaymentMode;
  currency: string;
  exchangeRate: number;
  lines: InvoiceLine[];
  globalDiscount: number;
  shippingCost: number;
  otherCosts: number;
  observation?: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  totalRemise: number;
  netAPayer: number;
  commercial: string;
  createdBy: string;
  createdAt: string;
}

// ============================================
// API TYPES
// ============================================
interface FournisseurItem { id: string; code: string; name: string; raisonSociale?: string; address?: string; phone?: string; email?: string }
interface ProductItem { id: string; code: string; designation: string; name?: string; unit?: string }

// ============================================
// UTILITY COMPONENTS
// ============================================
const StatusBadge: React.FC<{ status: InvoiceStatus }> = ({ status }) => {
  const configs: Record<InvoiceStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <Clock size={14} /> },
    received: { label: 'Reçue', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <Truck size={14} /> },
    validated: { label: 'Validée', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle2 size={14} /> },
    paid: { label: 'Payée', color: 'bg-green-50 text-green-600 border-green-200', icon: <DollarSign size={14} /> },
    partial: { label: 'Partielle', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <Percent size={14} /> },
    cancelled: { label: 'Annulée', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: <X size={14} /> },
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
export const FactureFournisseurFormModern: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [fournisseurs, setFournisseurs] = useState<FournisseurItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fournisseursRes, productsRes] = await Promise.all([
          axios.get('/api/parametres/fournisseurs?limit=200'),
          axios.get('/api/products?limit=200'),
        ]);
        setFournisseurs(fournisseursRes.data);
        setProducts(productsRes.data);
      } catch (err) {
        console.error('Erreur chargement données référence', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [formData, setFormData] = useState<FactureFournisseur>({
    id: '',
    number: 'FF-2026-001',
    supplierInvoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    receptionDate: new Date().toISOString().split('T')[0],
    supplierCode: '',
    supplierName: '',
    supplierAddress: '',
    supplierPhone: '',
    supplierEmail: '',
    status: 'draft',
    paymentMode: 'transfer',
    currency: 'MAD',
    exchangeRate: 1,
    lines: [],
    globalDiscount: 0,
    shippingCost: 0,
    otherCosts: 0,
    observation: '',
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0,
    totalRemise: 0,
    netAPayer: 0,
    commercial: 'Agent1',
    createdBy: 'Mohamed Admin',
    createdAt: new Date().toISOString(),
  });

  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'lines' | 'totals' | 'notes'>('lines');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [searchMode, setSearchMode] = useState<'text' | 'barcode' | 'image'>('text');

  const totals = useMemo(() => {
    const totalHT = formData.lines.reduce((sum, line) => sum + line.totalHT, 0);
    const totalTVA = formData.lines.reduce((sum, line) => sum + (line.totalHT * line.tva / 100), 0);
    const totalTTC = totalHT + totalTVA + formData.shippingCost + formData.otherCosts - formData.globalDiscount;
    const netAPayer = totalTTC;
    return { totalHT, totalTVA, totalTTC, netAPayer };
  }, [formData.lines, formData.shippingCost, formData.otherCosts, formData.globalDiscount]);

  const handleSelectSupplier = useCallback((supplier: FournisseurItem) => {
    setFormData(prev => ({
      ...prev,
      supplierCode: supplier.id,
      supplierName: supplier.name || supplier.raisonSociale || '',
      supplierAddress: supplier.address,
      supplierPhone: supplier.phone,
      supplierEmail: supplier.email,
    }));
    setShowSupplierDropdown(false);
    setSupplierSearch('');
  }, []);

  const handleAddLine = useCallback(() => {
    const newLine: InvoiceLine = {
      id: Date.now().toString(),
      lineNumber: formData.lines.length + 1,
      depot: 'DEP1',
      code: '',
      designation: '',
      description: '',
      quantity: 1,
      unit: 'Boîte',
      puHT: 0,
      remise: 0,
      remise2: 0,
      tva: 10,
      puTTC: 0,
      totalHT: 0,
      totalTTC: 0,
    };
    setFormData(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
  }, [formData.lines.length]);

  const handleSelectProduct = useCallback((product: ProductItem) => {
    const newLine: InvoiceLine = {
      id: Date.now().toString(),
      lineNumber: formData.lines.length + 1,
      depot: 'DEP1',
      code: product.id,
      designation: (product.designation || product.name || '').split(' ')[0],
      description: product.designation || product.name || '',
      quantity: 1,
      unit: product.unit || 'Boîte',
      puHT: 0,
      remise: 0,
      remise2: 0,
      tva: 20,
      puTTC: 0,
      totalHT: 0,
      totalTTC: 0,
    };
    setFormData(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
    setProductSearch('');
    setShowProductDropdown(false);
  }, [formData.lines.length]);

  const handleUpdateLine = useCallback((id: string, field: keyof InvoiceLine, value: any) => {
    setFormData(prev => {
      const updatedLines = prev.lines.map(line => {
        if (line.id !== id) return line;
        const updatedLine = { ...line, [field]: value };
        
        if (field === 'quantity' || field === 'puHT' || field === 'remise' || field === 'remise2' || field === 'tva') {
          const puRemise1 = updatedLine.puHT * (1 - updatedLine.remise / 100);
          const puRemise2 = puRemise1 * (1 - updatedLine.remise2 / 100);
          updatedLine.puTTC = puRemise2 * (1 + updatedLine.tva / 100);
          updatedLine.totalHT = updatedLine.quantity * puRemise2;
          updatedLine.totalTTC = updatedLine.quantity * updatedLine.puTTC;
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
    setSaving(true);
    try {
      const payload = {
        fournisseurId: formData.supplierCode,
        ...(formData.dueDate ? { dueDate: formData.dueDate } : {}),
        items: formData.lines.map(l => ({
          productId: l.code,
          quantity: l.quantity,
          priceHT: l.puHT,
          discount: l.remise || 0,
          tva: l.tva || 20,
        })),
      };
      await axios.post('/api/achat/factures', payload);
      navigate('/dashboard/achat/factures');
    } catch (err) {
      console.error('Erreur enregistrement facture', err);
      toast('error', "Erreur lors de l'enregistrement de la facture");
    } finally {
      setSaving(false);
    }
  }, [formData, navigate]);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return fournisseurs;
    return fournisseurs.filter(s => 
      s.name.toLowerCase().includes(supplierSearch.toLowerCase()) ||
      s.code.toLowerCase().includes(supplierSearch.toLowerCase())
    );
  }, [supplierSearch]);

  return (
    <DashboardLayout title="Nouvelle Facture Fournisseur">
      <div className=" mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/achat/factures')}
              className="p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-amber-600 hover:border-amber-300 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                <Receipt size={28} className="text-amber-600" />
                Nouvelle Facture Fournisseur
              </h2>
              <p className="text-sm text-gray-400">Saisir une facture d'achat</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={formData.status} />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFormData(prev => ({ ...prev, status: 'received' }))}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-lg font-medium hover:bg-amber-200"
            >
              <Truck size={18} />
              Réceptionner
            </motion.button>
            <motion.button
              whileHover={{ scale: !(saving || loading) ? 1.02 : 1 }}
              whileTap={{ scale: !(saving || loading) ? 0.98 : 1 }}
              onClick={handleSave}
              disabled={saving || loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-lg shadow-amber-500/25 transition-all ${saving || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'}`}
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
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">N° Facture Système</label>
                <input type="text" value={formData.number} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg font-mono font-semibold text-gray-600" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">N° Facture Fournisseur</label>
                <input type="text" value={formData.supplierInvoiceNumber || ''} onChange={(e) => setFormData(prev => ({ ...prev, supplierInvoiceNumber: e.target.value }))} placeholder="FAC-FR-XXXX" className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Date Facture</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Date Échéance</label>
                <input type="date" value={formData.dueDate} onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Date Réception</label>
                <input type="date" value={formData.receptionDate} onChange={(e) => setFormData(prev => ({ ...prev, receptionDate: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Mode Paiement</label>
                <select value={formData.paymentMode} onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value as PaymentMode }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/20">
                  <option value="cash">Espèces</option>
                  <option value="check">Chèque</option>
                  <option value="transfer">Virement</option>
                  <option value="credit">Crédit</option>
                </select>
              </div>
            </div>
          </div>

          {/* Supplier Section */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={20} className="text-amber-600" />
              <h3 className="font-bold text-gray-700">Informations Fournisseur</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative">
                <label className="text-xs font-semibold text-gray-400">Code Fournisseur *</label>
                <div className="relative">
                  <input type="text" value={formData.supplierCode} onClick={() => setShowSupplierDropdown(true)} readOnly placeholder="Sélectionner fournisseur..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer focus:ring-2 focus:ring-amber-500/20" />
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
                        <button key={supplier.id || supplier.code} onClick={() => handleSelectSupplier(supplier)} className="w-full px-4 py-3 text-left hover:bg-amber-50 border-b last:border-0">
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
                <label className="text-xs font-semibold text-gray-400">Contact</label>
                <input type="text" value={formData.supplierPhone || ''} readOnly className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'lines', label: 'Lignes Articles', icon: Package },
                { id: 'totals', label: 'Totaux & Frais', icon: Calculator },
                { id: 'notes', label: 'Observations', icon: FileText },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'text-amber-600 border-b-2 border-amber-500 bg-amber-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
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
                {/* Product Search Bar */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 relative">
                      <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} onFocus={() => setShowProductDropdown(true)} placeholder="Rechercher un produit par nom, code ou scan..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20" />
                      <AnimatePresence>
                        {showProductDropdown && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                            <div className="p-3 border-b border-gray-100 bg-gray-50">
                              <p className="text-xs font-semibold text-gray-400 uppercase">Produits suggérés</p>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {products.filter(p => (p.designation || p.name || '').toLowerCase().includes(productSearch.toLowerCase()) || p.code.toLowerCase().includes(productSearch.toLowerCase())).map(product => (
                                <button key={product.id} onClick={() => handleSelectProduct(product)} className="w-full px-4 py-3 text-left hover:bg-amber-50 border-b border-gray-100 last:border-0 flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs">{product.code}</div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-700">{product.designation || product.name}</p>
                                    <p className="text-xs text-gray-400">{product.unit || ''}</p>
                                  </div>
                                  <Plus size={18} className="text-amber-500" />
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button onClick={() => setSearchMode('barcode')} className={`p-3 rounded-lg border-2 transition-all ${searchMode === 'barcode' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-gray-200 hover:border-amber-300 text-gray-400'}`} title="Scan par code-barre"><Barcode size={22} /></button>
                    <button onClick={() => setSearchMode('image')} className={`p-3 rounded-lg border-2 transition-all ${searchMode === 'image' ? 'border-amber-500 bg-amber-50 text-amber-600' : 'border-gray-200 hover:border-amber-300 text-gray-400'}`} title="Recherche par image"><Camera size={22} /></button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAddLine} className="flex items-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 shadow-sm"><Plus size={20} /><span className="hidden sm:inline">Ajouter</span></motion.button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400"><ScanLine size={14} /><span>Scannez le code-barre du produit ou utilisez la recherche par image pour ajouter rapidement</span></div>
                </div>

                {/* Lines Table */}
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-8"></th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Produit</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Qté</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Prix HT</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">Rem.1%</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">Rem.2%</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">TVA</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Total HT</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-12">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.lines.map((line, idx) => (
                        <motion.tr key={line.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="hover:bg-gray-50 group">
                          <td className="px-2 py-3"><div className="text-slate-300 group-hover:text-slate-400 cursor-move"><GripVertical size={16} /></div></td>
                          <td className="px-4 py-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <input type="text" value={line.code} onChange={(e) => handleUpdateLine(line.id, 'code', e.target.value)} className="w-16 px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-200 rounded text-gray-500" placeholder="CODE" />
                                <input type="text" value={line.designation} onChange={(e) => handleUpdateLine(line.id, 'designation', e.target.value)} className="flex-1 px-2 py-1 text-sm font-medium border border-transparent hover:border-gray-200 rounded focus:border-amber-300 focus:outline-none" placeholder="Nom du produit" />
                              </div>
                              <input type="text" value={line.description || ''} onChange={(e) => handleUpdateLine(line.id, 'description', e.target.value)} className="w-full px-2 py-0.5 text-xs text-gray-400 border border-transparent hover:border-gray-200 rounded focus:border-amber-300 focus:outline-none" placeholder="Description détaillée..." />
                            </div>
                          </td>
                          <td className="px-2 py-3"><input type="number" min="0" step="0.01" value={line.quantity} onChange={(e) => handleUpdateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1.5 text-sm text-center bg-white border border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none" /></td>
                          <td className="px-2 py-3"><div className="relative"><input type="number" step="0.01" value={line.puHT} onChange={(e) => handleUpdateLine(line.id, 'puHT', parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1.5 text-sm text-right bg-white border border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none pr-6" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">DH</span></div></td>
                          <td className="px-2 py-3"><div className="relative"><input type="number" min="0" max="100" step="0.01" value={line.remise} onChange={(e) => handleUpdateLine(line.id, 'remise', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1.5 text-sm text-right bg-white border border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none pr-4" /><span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span></div></td>
                          <td className="px-2 py-3"><div className="relative"><input type="number" min="0" max="100" step="0.01" value={line.remise2} onChange={(e) => handleUpdateLine(line.id, 'remise2', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1.5 text-sm text-right bg-white border border-gray-200 rounded-lg focus:border-amber-500 focus:outline-none pr-4" /><span className="absolute right-1 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span></div></td>
                          <td className="px-2 py-3 text-center"><div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg"><span className="text-xs font-medium text-gray-500">{line.tva}%</span><span className="text-xs text-slate-400">|</span><span className="text-xs font-medium text-amber-600">{((line.tva / 100) * line.totalHT).toFixed(0)}</span></div></td>
                          <td className="px-2 py-3 text-right"><span className="text-sm font-semibold text-gray-700">{line.totalHT.toFixed(2)} DH</span></td>
                          <td className="px-2 py-3 text-center"><button onClick={() => handleDeleteLine(line.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button></td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {formData.lines.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center"><Package size={32} className="text-slate-300" /></div>
                    <p className="text-gray-400 font-medium">Aucune ligne ajoutée</p>
                    <p className="text-sm text-slate-400 mt-1">Utilisez la barre de recherche ou le scan pour ajouter des produits</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'totals' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Frais de Transport</label>
                    <div className="relative">
                      <input type="number" value={formData.shippingCost} onChange={(e) => setFormData(prev => ({ ...prev, shippingCost: parseFloat(e.target.value) || 0 }))} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 pr-12" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">DH</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Autres Frais</label>
                    <div className="relative">
                      <input type="number" value={formData.otherCosts} onChange={(e) => setFormData(prev => ({ ...prev, otherCosts: parseFloat(e.target.value) || 0 }))} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 pr-12" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">DH</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600 mb-2 block">Remise Globale</label>
                    <div className="relative">
                      <input type="number" value={formData.globalDiscount} onChange={(e) => setFormData(prev => ({ ...prev, globalDiscount: parseFloat(e.target.value) || 0 }))} className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 pr-12" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">DH</span>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Calculator size={18} className="text-amber-600" />Récapitulatif</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-amber-100"><span className="text-gray-500">Total HT</span><span className="font-semibold text-gray-700">{totals.totalHT.toFixed(2)} DH</span></div>
                    <div className="flex justify-between items-center py-2 border-b border-amber-100"><span className="text-gray-500">Total TVA</span><span className="font-semibold text-gray-700">{totals.totalTVA.toFixed(2)} DH</span></div>
                    <div className="flex justify-between items-center py-2 border-b border-amber-100"><span className="text-gray-500">Frais</span><span className="font-semibold text-gray-700">{(formData.shippingCost + formData.otherCosts).toFixed(2)} DH</span></div>
                    <div className="flex justify-between items-center py-2 border-b border-amber-100"><span className="text-gray-500">Remise Globale</span><span className="font-semibold text-rose-600">-{formData.globalDiscount.toFixed(2)} DH</span></div>
                    <div className="flex justify-between items-center py-2"><span className="text-lg font-semibold text-gray-700">Net à Payer</span><span className="text-2xl font-bold text-amber-600">{totals.netAPayer.toFixed(2)} DH</span></div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Observations</label>
                  <textarea value={formData.observation || ''} onChange={(e) => setFormData(prev => ({ ...prev, observation: e.target.value }))} rows={6} placeholder="Notes et observations concernant cette facture fournisseur..." className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500/20 resize-none" />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};
