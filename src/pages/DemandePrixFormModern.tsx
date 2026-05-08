/**
 * Demande de Prix Form - Modern 2026 Professional Design
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import {
  Save, X, Plus, Trash2, ArrowLeft, CheckCircle2, Building2, Hash,
  Calendar, Package, DollarSign, Search, ChevronDown, Printer, Send,
  Calculator, AlertCircle, FileText, User, Briefcase,
  Clock, Barcode, Camera, GripVertical, ScanLine, Percent, Receipt,
  Mail, Phone, MapPin, Loader2
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
type DemandeStatus = 'draft' | 'sent' | 'responded' | 'validated' | 'cancelled';
type ResponseStatus = 'pending' | 'received' | 'accepted' | 'rejected';

interface DemandeLine {
  id: string;
  lineNumber: number;
  code: string;
  designation: string;
  description?: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  supplierPrice?: number;
  responseStatus: ResponseStatus;
  observation?: string;
}

interface DemandePrix {
  id: string;
  number: string;
  date: string;
  expiryDate: string;
  affaire: string;
  clientName?: string;
  clientContact?: string;
  clientPhone?: string;
  clientEmail?: string;
  supplierCode: string;
  supplierName: string;
  supplierAddress?: string;
  supplierContact?: string;
  status: DemandeStatus;
  lines: DemandeLine[];
  totalQuantity: number;
  totalTarget: number;
  totalResponse: number;
  observation?: string;
  commercial: string;
  createdBy: string;
  createdAt: string;
}

// ============================================
// TYPES FOR API DATA
// ============================================
interface FournisseurItem { id: string; code: string; name: string; raisonSociale?: string; address?: string; contact?: string; phone?: string; email?: string }
interface ProductItem { id: string; code: string; designation: string; name?: string; unit?: string }

const AFFAIRES = [
  { code: 'AFF-2026-001', name: 'Approvisionnement Q2', client: 'Pharmacie Centrale' },
  { code: 'AFF-2026-002', name: 'Stock Urgence', client: 'Hôpital Privé' },
  { code: 'AFF-2026-003', name: 'Renouvellement Annuel', client: 'Réseau Pharmacies' },
];

// ============================================
// UTILITY COMPONENTS
// ============================================
const StatusBadge: React.FC<{ status: DemandeStatus }> = ({ status }) => {
  const configs: Record<DemandeStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <Clock size={14} /> },
    sent: { label: 'Envoyée', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <Send size={14} /> },
    responded: { label: 'Répondu', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <Receipt size={14} /> },
    validated: { label: 'Validée', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle2 size={14} /> },
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

const ResponseStatusBadge: React.FC<{ status: ResponseStatus }> = ({ status }) => {
  const configs: Record<ResponseStatus, { label: string; color: string }> = {
    pending: { label: 'En Attente', color: 'bg-gray-100 text-gray-500' },
    received: { label: 'Reçu', color: 'bg-blue-100 text-blue-700' },
    accepted: { label: 'Accepté', color: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'Refusé', color: 'bg-rose-100 text-rose-700' },
  };
  const config = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export const DemandePrixFormModern: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [fournisseurs, setFournisseurs] = useState<FournisseurItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fRes, pRes] = await Promise.all([
          axios.get('/api/parametres/fournisseurs', { params: { limit: 200 } }),
          axios.get('/api/products', { params: { limit: 200 } }),
        ]);
        setFournisseurs(fRes.data?.data || fRes.data || []);
        setProducts(pRes.data?.data || pRes.data || []);
      } catch (err) {
        console.error('Erreur chargement données:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const [formData, setFormData] = useState<DemandePrix>({
    id: '',
    number: '',
    date: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    affaire: '',
    clientName: '',
    clientContact: '',
    clientPhone: '',
    clientEmail: '',
    supplierCode: '',
    supplierName: '',
    supplierAddress: '',
    supplierContact: '',
    status: 'draft',
    lines: [],
    totalQuantity: 0,
    totalTarget: 0,
    totalResponse: 0,
    observation: '',
    commercial: '',
    createdBy: '',
    createdAt: new Date().toISOString(),
  });

  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'lines' | 'totals' | 'notes'>('lines');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [searchMode, setSearchMode] = useState<'text' | 'barcode' | 'image'>('text');
  const [showAffaireDropdown, setShowAffaireDropdown] = useState(false);

  const totals = useMemo(() => {
    const totalQuantity = formData.lines.reduce((sum, line) => sum + line.quantity, 0);
    const totalTarget = formData.lines.reduce((sum, line) => sum + ((line.targetPrice || 0) * line.quantity), 0);
    const totalResponse = formData.lines.reduce((sum, line) => sum + ((line.supplierPrice || 0) * line.quantity), 0);
    return { totalQuantity, totalTarget, totalResponse };
  }, [formData.lines]);

  const handleSelectSupplier = useCallback((supplier: FournisseurItem) => {
    setFormData(prev => ({
      ...prev,
      supplierCode: supplier.id,
      supplierName: supplier.name || supplier.raisonSociale || '',
      supplierAddress: supplier.address || '',
      supplierContact: supplier.contact || '',
    }));
    setShowSupplierDropdown(false);
    setSupplierSearch('');
  }, []);

  const handleSelectAffaire = useCallback((affaire: typeof AFFAIRES[0]) => {
    setFormData(prev => ({
      ...prev,
      affaire: affaire.code,
      clientName: affaire.client,
    }));
    setShowAffaireDropdown(false);
  }, []);

  const handleAddLine = useCallback(() => {
    const newLine: DemandeLine = {
      id: Date.now().toString(),
      lineNumber: formData.lines.length + 1,
      code: '',
      designation: '',
      description: '',
      quantity: 1,
      unit: 'Boîte',
      targetPrice: 0,
      supplierPrice: 0,
      responseStatus: 'pending',
      observation: '',
    };
    setFormData(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
  }, [formData.lines.length]);

  const handleSelectProduct = useCallback((product: ProductItem) => {
    const newLine: DemandeLine = {
      id: Date.now().toString(),
      lineNumber: formData.lines.length + 1,
      code: product.id,
      designation: product.designation || product.name || '',
      quantity: 1,
      unit: product.unit || '',
      targetPrice: undefined,
      supplierPrice: undefined,
      responseStatus: 'pending',
      observation: '',
    };
    setFormData(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
    setShowProductDropdown(false);
    setProductSearch('');
  }, [formData.lines.length]);

  const handleUpdateLine = useCallback((id: string, field: keyof DemandeLine, value: any) => {
    setFormData(prev => {
      const updatedLines = prev.lines.map(line => 
        line.id === id ? { ...line, [field]: value } : line
      );
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
    if (!formData.lines.length) { toast('error', "Veuillez ajouter au moins un article"); return; }
    setSaving(true);
    try {
      await axios.post('/api/achat/demandes', {
        fournisseurId: formData.supplierCode,
        items: formData.lines.map(l => ({
          productId: l.code,
          quantite: l.quantity,
          ...(l.targetPrice ? { prixPropose: l.targetPrice } : {}),
        })),
      });
      navigate('/dashboard/achat/demande-prix');
    } catch (err) {
      console.error('Erreur création demande:', err);
      toast('error', "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  }, [formData, navigate]);

  const handleSend = useCallback(() => {
    setFormData(prev => ({ ...prev, status: 'sent' }));
    toast('success', "Demande envoyée au fournisseur !");
  }, []);

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return fournisseurs;
    const q = supplierSearch.toLowerCase();
    return fournisseurs.filter(s =>
      (s.name || s.raisonSociale || '').toLowerCase().includes(q) ||
      (s.code || '').toLowerCase().includes(q)
    );
  }, [supplierSearch, fournisseurs]);

  return (
    <DashboardLayout title="Nouvelle Demande de Prix">
      <div className=" mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/achat/demande-prix')}
              className="p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-teal-600 hover:border-teal-300 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                <Receipt size={28} className="text-teal-600" />
                Nouvelle Demande de Prix
              </h2>
              <p className="text-sm text-gray-400">Demande de devis fournisseur</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={formData.status} />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSend}
              className="flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-lg font-medium hover:bg-teal-200"
            >
              <Send size={18} />
              Envoyer
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-500 text-white rounded-lg font-medium shadow-lg shadow-teal-500/25 disabled:opacity-50"
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
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">N° Demande</label>
                <input type="text" value={formData.number} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg font-mono font-semibold text-gray-600" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Date Demande</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Date Expiration</label>
                <input type="date" value={formData.expiryDate} onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20" />
              </div>
              <div className="space-y-2 relative">
                <label className="text-xs font-semibold text-gray-400 uppercase">Affaire / Projet</label>
                <div className="relative">
                  <input type="text" value={formData.affaire} onClick={() => setShowAffaireDropdown(true)} readOnly placeholder="Sélectionner..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer focus:ring-2 focus:ring-teal-500/20" />
                  <Briefcase size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <AnimatePresence>
                  {showAffaireDropdown && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                      {AFFAIRES.map(affaire => (
                        <button key={affaire.code} onClick={() => handleSelectAffaire(affaire)} className="w-full px-4 py-3 text-left hover:bg-teal-50 border-b last:border-0">
                          <p className="font-medium text-gray-700">{affaire.code}</p>
                          <p className="text-xs text-gray-400">{affaire.name} • {affaire.client}</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Two Columns - Client & Supplier */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            {/* Client Section */}
            <div className="p-6 border-b md:border-b-0 md:border-r border-gray-200">
              <div className="flex items-center gap-2 mb-4">
                <User size={20} className="text-teal-600" />
                <h3 className="font-bold text-gray-700">Client Final</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400">Nom Client</label>
                  <input type="text" value={formData.clientName || ''} onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))} placeholder="Nom du client..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-400">Contact</label>
                  <input type="text" value={formData.clientContact || ''} onChange={(e) => setFormData(prev => ({ ...prev, clientContact: e.target.value }))} placeholder="Nom du contact..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 flex items-center gap-1"><Phone size={12} /> Téléphone</label>
                    <input type="text" value={formData.clientPhone || ''} onChange={(e) => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))} placeholder="05XX..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-400 flex items-center gap-1"><Mail size={12} /> Email</label>
                    <input type="email" value={formData.clientEmail || ''} onChange={(e) => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))} placeholder="email@..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20" />
                  </div>
                </div>
              </div>
            </div>

            {/* Supplier Section */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={20} className="text-teal-600" />
                <h3 className="font-bold text-gray-700">Fournisseur</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <label className="text-xs font-semibold text-gray-400">Code Fournisseur *</label>
                  <div className="relative">
                    <input type="text" value={formData.supplierCode} onClick={() => setShowSupplierDropdown(true)} readOnly placeholder="Sélectionner fournisseur..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer focus:ring-2 focus:ring-teal-500/20" />
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
                        <button key={supplier.id || supplier.code} onClick={() => handleSelectSupplier(supplier)} className="w-full px-4 py-3 text-left hover:bg-teal-50 border-b last:border-0">
                          <p className="font-medium text-gray-700">{supplier.name || supplier.raisonSociale || ''}</p>
                          <p className="text-xs text-gray-400">{supplier.code || supplier.id} • {supplier.contact || supplier.phone || ''}</p>
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
                  <label className="text-xs font-semibold text-gray-400 flex items-center gap-1"><MapPin size={12} /> Adresse</label>
                  <input type="text" value={formData.supplierAddress || ''} readOnly className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'lines', label: 'Lignes Articles', icon: Package },
                { id: 'totals', label: 'Totaux & Réponse', icon: Calculator },
                { id: 'notes', label: 'Observations', icon: FileText },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'text-teal-600 border-b-2 border-teal-500 bg-teal-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
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
                      <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} onFocus={() => setShowProductDropdown(true)} placeholder="Rechercher un produit par nom, code ou scan..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20" />
                      <AnimatePresence>
                        {showProductDropdown && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                            <div className="p-3 border-b border-gray-100 bg-gray-50">
                              <p className="text-xs font-semibold text-gray-400 uppercase">Produits suggérés</p>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {products.filter(p => (p.designation || p.name || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.code || '').toLowerCase().includes(productSearch.toLowerCase())).map(product => {
                                const displayName = product.designation || product.name || '';
                                return (
                                <button key={product.id} onClick={() => handleSelectProduct(product)} className="w-full px-4 py-3 text-left hover:bg-teal-50 border-b border-gray-100 last:border-0 flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center text-teal-600 font-bold text-xs">{product.code || product.id.slice(-4)}</div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-700">{displayName}</p>
                                    <p className="text-xs text-gray-400">{product.unit || ''}</p>
                                  </div>
                                  <Plus size={18} className="text-teal-500" />
                                </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button onClick={() => setSearchMode('barcode')} className={`p-3 rounded-lg border-2 transition-all ${searchMode === 'barcode' ? 'border-teal-500 bg-teal-50 text-teal-600' : 'border-gray-200 hover:border-teal-300 text-gray-400'}`} title="Scan par code-barre"><Barcode size={22} /></button>
                    <button onClick={() => setSearchMode('image')} className={`p-3 rounded-lg border-2 transition-all ${searchMode === 'image' ? 'border-teal-500 bg-teal-50 text-teal-600' : 'border-gray-200 hover:border-teal-300 text-gray-400'}`} title="Recherche par image"><Camera size={22} /></button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAddLine} className="flex items-center gap-2 px-4 py-3 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 shadow-sm"><Plus size={20} /><span className="hidden sm:inline">Ajouter</span></motion.button>
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
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">Qté</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">Unité</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Prix Cible</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Prix Fourn.</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Statut</th>
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
                                <input type="text" value={line.designation} onChange={(e) => handleUpdateLine(line.id, 'designation', e.target.value)} className="flex-1 px-2 py-1 text-sm font-medium border border-transparent hover:border-gray-200 rounded focus:border-teal-300 focus:outline-none" placeholder="Nom du produit" />
                              </div>
                              <input type="text" value={line.description || ''} onChange={(e) => handleUpdateLine(line.id, 'description', e.target.value)} className="w-full px-2 py-0.5 text-xs text-gray-400 border border-transparent hover:border-gray-200 rounded focus:border-teal-300 focus:outline-none" placeholder="Description détaillée..." />
                            </div>
                          </td>
                          <td className="px-2 py-3"><input type="number" min="0" step="0.01" value={line.quantity} onChange={(e) => handleUpdateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1.5 text-sm text-center bg-white border border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none" /></td>
                          <td className="px-2 py-3"><input type="text" value={line.unit} onChange={(e) => handleUpdateLine(line.id, 'unit', e.target.value)} className="w-16 px-2 py-1.5 text-sm text-center bg-white border border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none" /></td>
                          <td className="px-2 py-3"><div className="relative"><input type="number" step="0.01" value={line.targetPrice || ''} onChange={(e) => handleUpdateLine(line.id, 'targetPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" className="w-24 px-2 py-1.5 text-sm text-right bg-white border border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none pr-6" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">DH</span></div></td>
                          <td className="px-2 py-3"><div className="relative"><input type="number" step="0.01" value={line.supplierPrice || ''} onChange={(e) => handleUpdateLine(line.id, 'supplierPrice', parseFloat(e.target.value) || 0)} placeholder="0.00" className={`w-24 px-2 py-1.5 text-sm text-right border rounded-lg focus:outline-none pr-6 ${line.supplierPrice && line.targetPrice ? (line.supplierPrice <= line.targetPrice ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50') : 'bg-white border-gray-200'}`} /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">DH</span></div></td>
                          <td className="px-2 py-3 text-center"><select value={line.responseStatus} onChange={(e) => handleUpdateLine(line.id, 'responseStatus', e.target.value)} className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:border-teal-500 focus:outline-none"><option value="pending">En Attente</option><option value="received">Reçu</option><option value="accepted">Accepté</option><option value="rejected">Refusé</option></select></td>
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-teal-50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Package size={20} className="text-teal-600" />
                    <h4 className="font-semibold text-gray-700">Quantités</h4>
                  </div>
                  <p className="text-3xl font-bold text-teal-600">{totals.totalQuantity}</p>
                  <p className="text-sm text-gray-400 mt-1">Articles demandés</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign size={20} className="text-gray-500" />
                    <h4 className="font-semibold text-gray-700">Budget Cible</h4>
                  </div>
                  <p className="text-3xl font-bold text-gray-600">{totals.totalTarget.toFixed(2)} DH</p>
                  <p className="text-sm text-gray-400 mt-1">Prix maximum souhaité</p>
                </div>
                <div className={`rounded-xl p-6 ${totals.totalResponse <= totals.totalTarget && totals.totalResponse > 0 ? 'bg-emerald-50' : totals.totalResponse > totals.totalTarget ? 'bg-rose-50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-4">
                    <Receipt size={20} className={totals.totalResponse <= totals.totalTarget && totals.totalResponse > 0 ? 'text-emerald-600' : totals.totalResponse > totals.totalTarget ? 'text-rose-600' : 'text-gray-500'} />
                    <h4 className="font-semibold text-gray-700">Réponse Fournisseur</h4>
                  </div>
                  <p className={`text-3xl font-bold ${totals.totalResponse <= totals.totalTarget && totals.totalResponse > 0 ? 'text-emerald-600' : totals.totalResponse > totals.totalTarget ? 'text-rose-600' : 'text-gray-600'}`}>{totals.totalResponse.toFixed(2)} DH</p>
                  <p className="text-sm text-gray-400 mt-1">Prix proposé</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Observations</label>
                  <textarea value={formData.observation || ''} onChange={(e) => setFormData(prev => ({ ...prev, observation: e.target.value }))} rows={6} placeholder="Conditions de paiement, délai de livraison, notes spéciales..." className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/20 resize-none" />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};
