/**
 * Mouvement de Stock Form - Modern 2026 Professional Design
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
  Save, X, Plus, Trash2, ArrowLeft, CheckCircle2, Hash,
  Calendar, Package, DollarSign, Search, ChevronDown, Printer,
  Calculator, AlertCircle, FileText, Warehouse, ArrowRightLeft,
  Clock, Barcode, Camera, GripVertical, Percent, ArrowUp, ArrowDown,
  RotateCcw, AlertTriangle, CheckSquare, Box, ScanLine, Loader2
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
type MovementType = 'ENTREE' | 'SORTIE' | 'TRANSFERT' | 'RETOUR' | 'INVENTAIRE' | 'AVARIE';
type MovementStatus = 'draft' | 'validated' | 'posted' | 'cancelled';

interface MovementLine {
  id: string;
  lineNumber: number;
  code: string;
  designation: string;
  description?: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
  batchNumber?: string;
  expiryDate?: string;
  location?: string;
  observation?: string;
}

interface MouvementStock {
  id: string;
  number: string;
  date: string;
  referenceDoc?: string;
  type: MovementType;
  status: MovementStatus;
  depotSource: string;
  depotSourceName: string;
  depotDest: string;
  depotDestName: string;
  lines: MovementLine[];
  totalQuantity: number;
  totalValue: number;
  observation?: string;
  responsible: string;
  createdBy: string;
  createdAt: string;
}

// ============================================
// API TYPES
// ============================================
interface DepotItem { id: string; nom: string; name?: string; code?: string }
interface ProductStockItem { id: string; code: string; designation: string; name?: string; unit?: string }

const MOVEMENT_TYPES: { value: MovementType; label: string; color: string; icon: React.ReactNode; direction: 'in' | 'out' | 'transfer' }[] = [
  { value: 'ENTREE', label: 'Entrée Stock', color: 'bg-emerald-100 text-emerald-700', icon: <ArrowDown size={16} />, direction: 'in' },
  { value: 'SORTIE', label: 'Sortie Stock', color: 'bg-rose-100 text-rose-700', icon: <ArrowUp size={16} />, direction: 'out' },
  { value: 'TRANSFERT', label: 'Transfert', color: 'bg-blue-100 text-blue-700', icon: <ArrowRightLeft size={16} />, direction: 'transfer' },
  { value: 'RETOUR', label: 'Retour', color: 'bg-amber-100 text-amber-700', icon: <RotateCcw size={16} />, direction: 'in' },
  { value: 'INVENTAIRE', label: 'Ajustement Inventaire', color: 'bg-purple-100 text-purple-700', icon: <CheckSquare size={16} />, direction: 'in' },
  { value: 'AVARIE', label: 'Avarie/Perte', color: 'bg-red-100 text-red-700', icon: <AlertTriangle size={16} />, direction: 'out' },
];

// ============================================
// UTILITY COMPONENTS
// ============================================
const StatusBadge: React.FC<{ status: MovementStatus }> = ({ status }) => {
  const configs: Record<MovementStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <Clock size={14} /> },
    validated: { label: 'Validé', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle2 size={14} /> },
    posted: { label: 'Comptabilisé', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <CheckSquare size={14} /> },
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
export const MouvementStockFormModern: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [depots, setDepots] = useState<DepotItem[]>([]);
  const [products, setProducts] = useState<ProductStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dRes, pRes] = await Promise.all([
          axios.get('/api/parametres/depots'),
          axios.get('/api/products', { params: { limit: 200 } }),
        ]);
        setDepots(dRes.data?.data || dRes.data || []);
        setProducts(pRes.data?.data || pRes.data || []);
      } catch (err) {
        console.error('Erreur chargement données:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const [formData, setFormData] = useState<MouvementStock>({
    id: '',
    number: 'MV-2026-001',
    date: new Date().toISOString().split('T')[0],
    referenceDoc: '',
    type: 'ENTREE',
    status: 'draft',
    depotSource: '',
    depotSourceName: '',
    depotDest: '',
    depotDestName: '',
    lines: [],
    totalQuantity: 0,
    totalValue: 0,
    observation: '',
    responsible: 'Agent1',
    createdBy: 'Mohamed Admin',
    createdAt: new Date().toISOString(),
  });

  const [showDepotSourceDropdown, setShowDepotSourceDropdown] = useState(false);
  const [showDepotDestDropdown, setShowDepotDestDropdown] = useState(false);
  const [depotSearch, setDepotSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'lines' | 'totals' | 'notes'>('lines');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [searchMode, setSearchMode] = useState<'text' | 'barcode' | 'image'>('text');

  const totals = useMemo(() => {
    const totalQuantity = formData.lines.reduce((sum, line) => sum + line.quantity, 0);
    const totalValue = formData.lines.reduce((sum, line) => sum + line.totalCost, 0);
    return { totalQuantity, totalValue };
  }, [formData.lines]);

  const currentType = MOVEMENT_TYPES.find(t => t.value === formData.type);

  const handleSelectDepotSource = useCallback((depot: DepotItem) => {
    setFormData(prev => ({
      ...prev,
      depotSource: depot.id || depot.code,
      depotSourceName: depot.nom || depot.name,
    }));
    setShowDepotSourceDropdown(false);
    setDepotSearch('');
  }, []);

  const handleSelectDepotDest = useCallback((depot: DepotItem) => {
    setFormData(prev => ({
      ...prev,
      depotDest: depot.id || depot.code,
      depotDestName: depot.nom || depot.name,
    }));
    setShowDepotDestDropdown(false);
    setDepotSearch('');
  }, []);

  const handleAddProduct = useCallback((product: ProductStockItem) => {
    const newLine: MovementLine = {
      id: Date.now().toString(),
      lineNumber: formData.lines.length + 1,
      code: product.id,
      designation: product.designation || product.name || product.code,
      description: product.designation || product.name || '',
      quantity: 1,
      unit: product.unit || 'Boîte',
      unitCost: 0,
      totalCost: 0,
      location: 'A-01',
    };
    setFormData(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
    setProductSearch('');
    setShowProductDropdown(false);
  }, [formData.lines.length]);

  const handleAddLine = useCallback(() => {
    const newLine: MovementLine = {
      id: Date.now().toString(),
      lineNumber: formData.lines.length + 1,
      code: '',
      designation: '',
      description: '',
      quantity: 1,
      unit: 'Boîte',
      unitCost: 0,
      totalCost: 0,
      location: 'A-01',
    };
    setFormData(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
  }, [formData.lines.length]);

  const handleUpdateLine = useCallback((id: string, field: keyof MovementLine, value: any) => {
    setFormData(prev => {
      const updatedLines = prev.lines.map(line => {
        if (line.id !== id) return line;
        const updatedLine = { ...line, [field]: value };
        
        if (field === 'quantity' || field === 'unitCost') {
          updatedLine.totalCost = updatedLine.quantity * updatedLine.unitCost;
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
    if (!formData.depotSource) { toast('error', "Veuillez sélectionner un dépôt"); return; }
    if (!formData.lines.length) { toast('error', "Veuillez ajouter au moins un article"); return; }
    setSaving(true);
    try {
      const typeMap: Record<string, string> = { 'ENTREE': 'entrée', 'SORTIE': 'sortie', 'TRANSFERT': 'correction', 'RETOUR': 'entrée', 'INVENTAIRE': 'correction', 'AVARIE': 'sortie' };
      const apiType = typeMap[formData.type] || 'correction';
      await Promise.all(formData.lines.map(line =>
        axios.post('/api/stock/mouvements', {
          productId: line.code,
          depotId: formData.depotSource,
          type: apiType,
          quantite: line.quantity,
          prixUnitaire: line.unitCost || undefined,
          documentRef: formData.number || undefined,
          motif: formData.observation || undefined,
        })
      ));
      navigate('/dashboard/stock/mouvement');
    } catch (err) {
      console.error('Erreur création mouvement:', err);
      toast('error', "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  }, [formData, navigate]);

  const filteredDepots = useMemo(() => {
    if (!depotSearch) return depots;
    return depots.filter(d => 
      d.name.toLowerCase().includes(depotSearch.toLowerCase()) ||
      d.code.toLowerCase().includes(depotSearch.toLowerCase())
    );
  }, [depotSearch]);

  // Determine which depots to show based on movement type
  const showSourceDepot = currentType?.direction === 'out' || currentType?.direction === 'transfer';
  const showDestDepot = currentType?.direction === 'in' || currentType?.direction === 'transfer';

  return (
    <DashboardLayout title="Nouveau Mouvement de Stock">
      <div className=" mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/stock/mouvement')}
              className="p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-orange-600 hover:border-orange-300 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                <ArrowRightLeft size={28} className="text-orange-600" />
                Nouveau Mouvement de Stock
              </h2>
              <p className="text-sm text-gray-400">Gestion des mouvements d'entrée, sortie et transfert</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={formData.status} />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFormData(prev => ({ ...prev, status: 'validated' }))}
              className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg font-medium hover:bg-orange-200"
            >
              <CheckCircle2 size={18} />
              Valider
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || loading}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-medium shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">N° Mouvement</label>
                <input type="text" value={formData.number} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg font-mono font-semibold text-gray-600" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Type Mouvement</label>
                <select value={formData.type} onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as MovementType }))} className={`w-full px-3 py-2 border rounded-lg font-medium text-sm focus:ring-2 focus:ring-orange-500/20 ${currentType?.color.replace('text-', 'border-').split(' ')[1] || 'border-gray-200'}`}>
                  {MOVEMENT_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Référence Doc.</label>
                <input type="text" value={formData.referenceDoc || ''} onChange={(e) => setFormData(prev => ({ ...prev, referenceDoc: e.target.value }))} placeholder="N° Bon, Facture, etc." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20" />
              </div>
            </div>
          </div>

          {/* Depot Selection */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Warehouse size={20} className="text-orange-600" />
              <h3 className="font-bold text-gray-700">Dépôts</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {showSourceDepot && (
                <div className="space-y-2 relative">
                  <label className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                    <ArrowUp size={12} />
                    Dépôt Source {currentType?.direction === 'transfer' && '(Sortie)'}
                  </label>
                  <div className="relative">
                    <input type="text" value={formData.depotSource} onClick={() => setShowDepotSourceDropdown(true)} readOnly placeholder="Sélectionner dépôt..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer focus:ring-2 focus:ring-orange-500/20" />
                    <Warehouse size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <AnimatePresence>
                    {showDepotSourceDropdown && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" autoFocus placeholder="Rechercher..." value={depotSearch} onChange={(e) => setDepotSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                          </div>
                        </div>
                        {filteredDepots.map(depot => (
                          <button key={depot.id || depot.code} onClick={() => handleSelectDepotSource(depot)} className="w-full px-4 py-3 text-left hover:bg-orange-50 border-b last:border-0">
                            <p className="font-medium text-gray-700">{depot.nom || depot.name}</p>
                            <p className="text-xs text-gray-400">{depot.id || depot.code}</p>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
              {showDestDepot && (
                <div className="space-y-2 relative">
                  <label className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                    <ArrowDown size={12} />
                    Dépôt Destination {currentType?.direction === 'transfer' && '(Entrée)'}
                  </label>
                  <div className="relative">
                    <input type="text" value={formData.depotDest} onClick={() => setShowDepotDestDropdown(true)} readOnly placeholder="Sélectionner dépôt..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer focus:ring-2 focus:ring-orange-500/20" />
                    <Warehouse size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <AnimatePresence>
                    {showDepotDestDropdown && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                        <div className="p-2 border-b">
                          <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input type="text" autoFocus placeholder="Rechercher..." value={depotSearch} onChange={(e) => setDepotSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                          </div>
                        </div>
                        {filteredDepots.map(depot => (
                          <button key={depot.id || depot.code} onClick={() => handleSelectDepotDest(depot)} className="w-full px-4 py-3 text-left hover:bg-orange-50 border-b last:border-0">
                            <p className="font-medium text-gray-700">{depot.nom || depot.name}</p>
                            <p className="text-xs text-gray-400">{depot.id || depot.code}</p>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'lines', label: 'Lignes Articles', icon: Package },
                { id: 'totals', label: 'Totaux', icon: Calculator },
                { id: 'notes', label: 'Observations', icon: FileText },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'text-orange-600 border-b-2 border-orange-500 bg-orange-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
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
                      <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} onFocus={() => setShowProductDropdown(true)} placeholder="Rechercher un produit par nom, code ou scan..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20" />
                      <AnimatePresence>
                        {showProductDropdown && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                            <div className="p-3 border-b border-gray-100 bg-gray-50">
                              <p className="text-xs font-semibold text-gray-400 uppercase">Produits disponibles</p>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {products.filter(p => (p.designation || p.name || '').toLowerCase().includes(productSearch.toLowerCase()) || (p.code || '').toLowerCase().includes(productSearch.toLowerCase())).map(product => (
                                <button key={product.id} onClick={() => handleAddProduct(product)} className="w-full px-4 py-3 text-left hover:bg-orange-50 border-b border-gray-100 last:border-0 flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs">{product.code}</div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-700">{product.designation || product.name}</p>
                                    <p className="text-xs text-gray-400">{product.unit || 'Unité'}</p>
                                  </div>
                                  <Plus size={18} className="text-orange-500" />
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button onClick={() => setSearchMode('barcode')} className={`p-3 rounded-lg border-2 transition-all ${searchMode === 'barcode' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 hover:border-orange-300 text-gray-400'}`} title="Scan par code-barre"><Barcode size={22} /></button>
                    <button onClick={() => setSearchMode('image')} className={`p-3 rounded-lg border-2 transition-all ${searchMode === 'image' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200 hover:border-orange-300 text-gray-400'}`} title="Recherche par image"><Camera size={22} /></button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAddLine} className="flex items-center gap-2 px-4 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 shadow-sm"><Plus size={20} /><span className="hidden sm:inline">Ajouter</span></motion.button>
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
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">Lot</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Qté</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">Unité</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Prix Unitaire</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Total</th>
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
                                <input type="text" value={line.designation} onChange={(e) => handleUpdateLine(line.id, 'designation', e.target.value)} className="flex-1 px-2 py-1 text-sm font-medium border border-transparent hover:border-gray-200 rounded focus:border-orange-300 focus:outline-none" placeholder="Nom du produit" />
                              </div>
                              <input type="text" value={line.description || ''} onChange={(e) => handleUpdateLine(line.id, 'description', e.target.value)} className="w-full px-2 py-0.5 text-xs text-gray-400 border border-transparent hover:border-gray-200 rounded focus:border-orange-300 focus:outline-none" placeholder="Description..." />
                            </div>
                          </td>
                          <td className="px-2 py-3"><input type="text" value={line.batchNumber || ''} onChange={(e) => handleUpdateLine(line.id, 'batchNumber', e.target.value)} placeholder="Lot" className="w-20 px-2 py-1.5 text-xs text-center bg-white border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none" /></td>
                          <td className="px-2 py-3"><input type="number" min="0" step="0.01" value={line.quantity} onChange={(e) => handleUpdateLine(line.id, 'quantity', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1.5 text-sm text-center bg-white border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none" /></td>
                          <td className="px-2 py-3"><input type="text" value={line.unit} onChange={(e) => handleUpdateLine(line.id, 'unit', e.target.value)} className="w-16 px-2 py-1.5 text-sm text-center bg-white border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none" /></td>
                          <td className="px-2 py-3"><div className="relative"><input type="number" step="0.01" value={line.unitCost} onChange={(e) => handleUpdateLine(line.id, 'unitCost', parseFloat(e.target.value) || 0)} className="w-24 px-2 py-1.5 text-sm text-right bg-white border border-gray-200 rounded-lg focus:border-orange-500 focus:outline-none pr-6" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">DH</span></div></td>
                          <td className="px-2 py-3 text-right"><span className="text-sm font-semibold text-gray-700">{line.totalCost.toFixed(2)} DH</span></td>
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
                    <p className="text-sm text-slate-400 mt-1">Scannez ou recherchez les produits à ajouter</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'totals' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-orange-50 rounded-xl p-6">
                  <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2"><Calculator size={18} className="text-orange-600" />Récapitulatif</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-orange-100"><span className="text-gray-500">Type de Mouvement</span><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${currentType?.color}`}>{currentType?.icon}{currentType?.label}</span></div>
                    <div className="flex justify-between items-center py-2 border-b border-orange-100"><span className="text-gray-500">Quantité Totale</span><span className="font-semibold text-gray-700">{totals.totalQuantity}</span></div>
                    <div className="flex justify-between items-center py-2"><span className="text-lg font-semibold text-gray-700">Valeur Totale</span><span className="text-2xl font-bold text-orange-600">{totals.totalValue.toFixed(2)} DH</span></div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Warehouse size={20} className="text-gray-500" /></div>
                      <div><p className="text-sm text-gray-400">Dépôt Source</p><p className="font-semibold text-gray-700">{formData.depotSourceName || '-'}</p></div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><Warehouse size={20} className="text-gray-500" /></div>
                      <div><p className="text-sm text-gray-400">Dépôt Destination</p><p className="font-semibold text-gray-700">{formData.depotDestName || '-'}</p></div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Observations</label>
                  <textarea value={formData.observation || ''} onChange={(e) => setFormData(prev => ({ ...prev, observation: e.target.value }))} rows={6} placeholder="Notes et observations concernant ce mouvement de stock..." className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500/20 resize-none" />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};
