/**
 * Inventaire Form - Modern 2026 Professional Design
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
  Save, X, Plus, Trash2, ArrowLeft, CheckCircle2, Hash,
  Calendar, Package, DollarSign, Search, ChevronDown, Printer,
  Calculator, AlertCircle, FileText, Warehouse, ScanLine,
  Clock, Barcode, Camera, GripVertical, Percent, Box,
  Layers, ClipboardList, ArrowUpDown, CheckSquare, QrCode,
  ScanBarcode, RefreshCw, Loader2
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
type InventoryStatus = 'draft' | 'in_progress' | 'validated' | 'adjusted' | 'cancelled';
type InventoryType = 'full' | 'partial' | 'cycle' | 'spot';

interface InventoryLine {
  id: string;
  lineNumber: number;
  code: string;
  designation: string;
  unit: string;
  theoreticalQty: number;
  actualQty: number;
  difference: number;
  unitCost: number;
  totalDifference: number;
  batchNumber?: string;
  location?: string;
  isAdjusted: boolean;
}

interface Inventaire {
  id: string;
  number: string;
  date: string;
  depot: string;
  depotName: string;
  status: InventoryStatus;
  type: InventoryType;
  lines: InventoryLine[];
  totalPositive: number;
  totalNegative: number;
  netAdjustment: number;
  observation?: string;
  responsible: string;
  createdBy: string;
  createdAt: string;
}

// ============================================
// API TYPES
// ============================================
interface DepotItem { id: string; nom: string; code?: string }
interface ProductInvItem { id: string; code: string; designation: string; name?: string; unit?: string }

const INVENTORY_TYPES: { value: InventoryType; label: string; color: string; icon: React.ReactNode }[] = [
  { value: 'full', label: 'Inventaire Complet', color: 'bg-blue-100 text-blue-700', icon: <Layers size={14} /> },
  { value: 'partial', label: 'Inventaire Partiel', color: 'bg-amber-100 text-amber-700', icon: <Box size={14} /> },
  { value: 'cycle', label: 'Inventaire Rotatif', color: 'bg-emerald-100 text-emerald-700', icon: <RefreshCw size={14} /> },
  { value: 'spot', label: 'Contrôle Ponctuel', color: 'bg-violet-100 text-violet-700', icon: <ScanBarcode size={14} /> },
];

// ============================================
// UTILITY COMPONENTS
// ============================================
const StatusBadge: React.FC<{ status: InventoryStatus }> = ({ status }) => {
  const configs: Record<InventoryStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <Clock size={14} /> },
    in_progress: { label: 'En Cours', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <RefreshCw size={14} /> },
    validated: { label: 'Validé', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle2 size={14} /> },
    adjusted: { label: 'Ajusté', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <CheckSquare size={14} /> },
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

const getDifferenceColor = (diff: number) => {
  if (diff > 0) return 'text-emerald-600 bg-emerald-50';
  if (diff < 0) return 'text-rose-600 bg-rose-50';
  return 'text-gray-500 bg-gray-50';
};

// ============================================
// MAIN COMPONENT
// ============================================
export const InventaireFormModern: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [depots, setDepots] = useState<DepotItem[]>([]);
  const [products, setProducts] = useState<ProductInvItem[]>([]);
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
  
  const [formData, setFormData] = useState<Inventaire>({
    id: '',
    number: 'INV-2026-001',
    date: new Date().toISOString().split('T')[0],
    depot: '',
    depotName: '',
    status: 'draft',
    type: 'full',
    lines: [],
    totalPositive: 0,
    totalNegative: 0,
    netAdjustment: 0,
    observation: '',
    responsible: 'Agent1',
    createdBy: 'Mohamed Admin',
    createdAt: new Date().toISOString(),
  });

  const [activeTab, setActiveTab] = useState<'lines' | 'totals' | 'notes'>('lines');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [searchMode, setSearchMode] = useState<'text' | 'barcode' | 'image'>('text');
  const [showDepotDropdown, setShowDepotDropdown] = useState(false);

  const totals = useMemo(() => {
    const totalPositive = formData.lines.filter(l => l.difference > 0).reduce((sum, line) => sum + line.totalDifference, 0);
    const totalNegative = formData.lines.filter(l => l.difference < 0).reduce((sum, line) => sum + Math.abs(line.totalDifference), 0);
    const netAdjustment = totalPositive - totalNegative;
    return { totalPositive, totalNegative, netAdjustment };
  }, [formData.lines]);

  const handleSelectDepot = useCallback((depot: DepotItem) => {
    setFormData(prev => ({
      ...prev,
      depot: depot.id || depot.code || '',
      depotName: depot.nom,
    }));
    setShowDepotDropdown(false);
  }, []);

  const handleAddProduct = useCallback((product: ProductInvItem) => {
    const newLine: InventoryLine = {
      id: Date.now().toString(),
      lineNumber: formData.lines.length + 1,
      code: product.id,
      designation: product.designation || product.name || '',
      unit: product.unit || '',
      theoreticalQty: 0,
      actualQty: 0,
      difference: 0,
      unitCost: 0,
      totalDifference: 0,
      location: 'A-01',
      isAdjusted: false,
    };
    setFormData(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
    setProductSearch('');
    setShowProductDropdown(false);
  }, [formData.lines.length]);

  const handleUpdateLine = useCallback((id: string, field: keyof InventoryLine, value: any) => {
    setFormData(prev => {
      const updatedLines = prev.lines.map(line => {
        if (line.id !== id) return line;
        const updatedLine = { ...line, [field]: value };
        
        if (field === 'actualQty' || field === 'theoreticalQty') {
          updatedLine.difference = updatedLine.actualQty - updatedLine.theoreticalQty;
          updatedLine.totalDifference = updatedLine.difference * updatedLine.unitCost;
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
    if (!formData.lines.length) { toast('error', "Veuillez ajouter au moins un article"); return; }
    setSaving(true);
    try {
      await axios.post('/api/stock/inventaires', {
        depotId: formData.depot || undefined,
        items: formData.lines.map(l => ({
          productId: l.code,
          stockTheorique: l.theoreticalQty,
          stockPhysique: l.actualQty,
        })),
      });
      navigate('/dashboard/stock/inventaire');
    } catch (err) {
      console.error('Erreur création inventaire:', err);
      toast('error', "Erreur lors de la création");
    } finally {
      setSaving(false);
    }
  }, [formData, navigate]);

  const handleQuickAdjust = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      lines: prev.lines.map(line => ({ ...line, isAdjusted: line.difference !== 0 })),
      status: 'adjusted',
    }));
    toast('success', "Ajustements appliqués avec succès !");
  }, []);

  const currentType = INVENTORY_TYPES.find(t => t.value === formData.type);

  return (
    <DashboardLayout title="Nouvel Inventaire">
      <div className=" mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard/stock/inventaire')}
              className="p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-all"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                <ClipboardList size={28} className="text-indigo-600" />
                Nouvel Inventaire
              </h2>
              <p className="text-sm text-gray-400">Comptage et ajustement des stocks</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={formData.status} />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFormData(prev => ({ ...prev, status: 'in_progress' }))}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200"
            >
              <RefreshCw size={18} />
              Démarrer
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium shadow-lg shadow-indigo-500/25 text-white ${saving || loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-500 to-purple-500'}`}
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
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-white">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">N° Inventaire</label>
                <input type="text" value={formData.number} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg font-mono font-semibold text-gray-600" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Type d'Inventaire</label>
                <select value={formData.type} onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as InventoryType }))} className={`w-full px-3 py-2 border rounded-lg font-medium text-sm focus:ring-2 focus:ring-indigo-500/20 ${currentType?.color.replace('text-', 'border-').split(' ')[1] || 'border-gray-200'}`}>
                  {INVENTORY_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 relative">
                <label className="text-xs font-semibold text-gray-400 uppercase">Dépôt</label>
                <div className="relative">
                  <input type="text" value={formData.depot} onClick={() => setShowDepotDropdown(true)} readOnly placeholder="Sélectionner..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer focus:ring-2 focus:ring-indigo-500/20" />
                  <Warehouse size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <AnimatePresence>
                  {showDepotDropdown && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                      {depots.map(depot => (
                        <button key={depot.id || depot.code} onClick={() => handleSelectDepot(depot)} className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b last:border-0">
                          <p className="font-medium text-gray-700">{depot.nom}</p>
                          <p className="text-xs text-gray-400">{depot.id || depot.code}</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Depot Info */}
          {formData.depot && (
            <div className="px-6 py-3 bg-indigo-50/50 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <Warehouse size={16} className="text-indigo-600" />
                <span className="text-sm font-medium text-gray-600">{formData.depotName}</span>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'lines', label: 'Lignes Inventaire', icon: ClipboardList },
                { id: 'totals', label: 'Écarts & Ajustements', icon: Calculator },
                { id: 'notes', label: 'Observations', icon: FileText },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-500 bg-indigo-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
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
                      <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} onFocus={() => setShowProductDropdown(true)} placeholder="Rechercher un produit par nom, code ou scan..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      <AnimatePresence>
                        {showProductDropdown && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                            <div className="p-3 border-b border-gray-100 bg-gray-50">
                              <p className="text-xs font-semibold text-gray-400 uppercase">Produits à inventorier</p>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {products.filter(p => (p.designation || p.name || '').toLowerCase().includes(productSearch.toLowerCase()) || p.code.toLowerCase().includes(productSearch.toLowerCase())).map(product => (
                                <button key={product.id} onClick={() => handleAddProduct(product)} className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b border-gray-100 last:border-0 flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">{product.code}</div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-700">{product.designation || product.name}</p>
                                    <p className="text-xs text-gray-400">{product.unit || ''}</p>
                                  </div>
                                  <Plus size={18} className="text-indigo-500" />
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <button onClick={() => setSearchMode('barcode')} className={`p-3 rounded-lg border-2 transition-all ${searchMode === 'barcode' ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 hover:border-indigo-300 text-gray-400'}`} title="Scan par code-barre"><Barcode size={22} /></button>
                    <button onClick={() => setSearchMode('image')} className={`p-3 rounded-lg border-2 transition-all ${searchMode === 'image' ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 hover:border-indigo-300 text-gray-400'}`} title="Recherche par image"><Camera size={22} /></button>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400"><ScanLine size={14} /><span>Scannez les produits ou utilisez la recherche pour ajouter à l'inventaire</span></div>
                </div>

                {/* Lines Table */}
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-8"></th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Produit</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Théorique</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Réel</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Écart</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">Prix</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Valeur Écart</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-16">Ajusté</th>
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
                                <span className="px-2 py-0.5 text-xs font-mono bg-gray-100 rounded text-gray-500">{line.code}</span>
                                <span className="font-medium text-gray-700">{line.designation}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span>{line.unit}</span>
                                <span>•</span>
                                <span>Emplacement: {line.location}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-2 py-3"><input type="number" min="0" step="0.01" value={line.theoreticalQty} onChange={(e) => handleUpdateLine(line.id, 'theoreticalQty', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1.5 text-sm text-center bg-gray-50 border border-gray-200 rounded-lg focus:border-indigo-500 focus:outline-none" /></td>
                          <td className="px-2 py-3"><input type="number" min="0" step="0.01" value={line.actualQty} onChange={(e) => handleUpdateLine(line.id, 'actualQty', parseFloat(e.target.value) || 0)} className={`w-20 px-2 py-1.5 text-sm text-center border rounded-lg focus:outline-none ${line.difference !== 0 ? 'border-indigo-500 bg-indigo-50' : 'bg-white border-gray-200'}`} /></td>
                          <td className="px-2 py-3 text-center"><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold ${getDifferenceColor(line.difference)}`}>{line.difference > 0 ? '+' : ''}{line.difference}</span></td>
                          <td className="px-2 py-3 text-center text-sm text-gray-500">{line.unitCost.toFixed(2)}</td>
                          <td className="px-2 py-3 text-right"><span className={`text-sm font-semibold ${line.totalDifference > 0 ? 'text-emerald-600' : line.totalDifference < 0 ? 'text-rose-600' : 'text-gray-500'}`}>{line.totalDifference > 0 ? '+' : ''}{line.totalDifference.toFixed(2)} DH</span></td>
                          <td className="px-2 py-3 text-center">{line.isAdjusted ? <CheckSquare size={18} className="text-emerald-500 mx-auto" /> : <span className="text-slate-300">-</span>}</td>
                          <td className="px-2 py-3 text-center"><button onClick={() => handleDeleteLine(line.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18} /></button></td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {formData.lines.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center"><ClipboardList size={32} className="text-slate-300" /></div>
                    <p className="text-gray-400 font-medium">Aucune ligne d'inventaire</p>
                    <p className="text-sm text-slate-400 mt-1">Scannez ou recherchez les produits à inventorier</p>
                  </div>
                )}

                {/* Quick Adjust Button */}
                {formData.lines.some(l => l.difference !== 0) && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
                    <button onClick={handleQuickAdjust} className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg font-medium hover:bg-emerald-600 shadow-sm">
                      <CheckSquare size={18} />
                      Appliquer les Ajustements
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'totals' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-emerald-50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowUpDown size={20} className="text-emerald-600" />
                    <h4 className="font-semibold text-gray-700">Écarts Positifs</h4>
                  </div>
                  <p className="text-3xl font-bold text-emerald-600">{totals.totalPositive.toFixed(2)} DH</p>
                  <p className="text-sm text-gray-400 mt-1">Surplus de stock</p>
                </div>
                <div className="bg-rose-50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowUpDown size={20} className="text-rose-600" />
                    <h4 className="font-semibold text-gray-700">Écarts Négatifs</h4>
                  </div>
                  <p className="text-3xl font-bold text-rose-600">{totals.totalNegative.toFixed(2)} DH</p>
                  <p className="text-sm text-gray-400 mt-1">Manquant de stock</p>
                </div>
                <div className="bg-indigo-50 rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Calculator size={20} className="text-indigo-600" />
                    <h4 className="font-semibold text-gray-700">Ajustement Net</h4>
                  </div>
                  <p className={`text-3xl font-bold ${totals.netAdjustment >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {totals.netAdjustment > 0 ? '+' : ''}{totals.netAdjustment.toFixed(2)} DH
                  </p>
                  <p className="text-sm text-gray-400 mt-1">Valeur totale des ajustements</p>
                </div>
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Observations</label>
                  <textarea value={formData.observation || ''} onChange={(e) => setFormData(prev => ({ ...prev, observation: e.target.value }))} rows={6} placeholder="Notes et observations concernant cet inventaire..." className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 resize-none" />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};
