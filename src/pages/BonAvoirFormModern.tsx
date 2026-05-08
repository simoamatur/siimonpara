import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import {
  Save, X, Plus, Trash2, ArrowLeft, CheckCircle2, Hash,
  Calendar, Package, DollarSign, Search, ChevronDown,
  Calculator, FileText, User, RotateCcw,
  Clock, Barcode, GripVertical, ScanLine
} from 'lucide-react';

interface AvoirLine {
  id: string;
  lineNumber: number;
  productId: string;
  code: string;
  designation: string;
  montant: number;
}

interface BonAvoirForm {
  id: string;
  number: string;
  date: string;
  clientId: string;
  clientName: string;
  clientAddress?: string;
  clientPhone?: string;
  status: string;
  lines: AvoirLine[];
  totalTTC: number;
  observation?: string;
  createdBy: string;
  createdAt: string;
}

interface ClientOption { id: string; code: string; name: string; address?: string; phone?: string; }
interface ProductOption { id: string; code: string; name: string; }

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { label: string; color: string }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-500 border-gray-200' },
    validated: { label: 'Validé', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  };
  const config = configs[status] || configs.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.color}`}>
      <Clock size={14} /> {config.label}
    </span>
  );
};

export const BonAvoirFormModern: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<BonAvoirForm>({
    id: '',
    number: 'AV-2026-' + String(Math.floor(Math.random() * 1000)).padStart(3, '0'),
    date: new Date().toISOString().split('T')[0],
    clientId: '',
    clientName: '',
    clientAddress: '',
    clientPhone: '',
    status: 'draft',
    lines: [],
    totalTTC: 0,
    observation: '',
    createdBy: 'Admin',
    createdAt: new Date().toISOString(),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, productsRes] = await Promise.all([
          axios.get('/api/clients'),
          axios.get('/api/products'),
        ]);
        const cData = clientsRes.data.data || clientsRes.data;
        const pData = productsRes.data.data || productsRes.data;
        setClients(Array.isArray(cData) ? cData : []);
        setProducts(Array.isArray(pData) ? pData : []);
      } catch (err) {
        console.error('Erreur chargement formulaire', err);
      }
    };
    fetchData();
  }, []);

  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'lines' | 'notes'>('lines');
  const [productSearch, setProductSearch] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);

  const totalTTC = useMemo(() => {
    return formData.lines.reduce((sum, line) => sum + line.montant, 0);
  }, [formData.lines]);

  const handleSelectClient = useCallback((client: ClientOption) => {
    setFormData(prev => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientAddress: client.address || '',
      clientPhone: client.phone || '',
    }));
    setShowClientDropdown(false);
    setClientSearch('');
  }, []);

  const handleAddLine = useCallback(() => {
    const newLine: AvoirLine = {
      id: Date.now().toString(),
      lineNumber: formData.lines.length + 1,
      productId: '',
      code: '',
      designation: '',
      montant: 0,
    };
    setFormData(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
  }, [formData.lines.length]);

  const handleSelectProduct = useCallback((product: ProductOption) => {
    const newLine: AvoirLine = {
      id: Date.now().toString(),
      lineNumber: formData.lines.length + 1,
      productId: product.id,
      code: product.code,
      designation: product.name,
      montant: 0,
    };
    setFormData(prev => ({ ...prev, lines: [...prev.lines, newLine] }));
    setProductSearch('');
    setShowProductDropdown(false);
  }, [formData.lines.length]);

  const handleUpdateLine = useCallback((id: string, field: keyof AvoirLine, value: any) => {
    setFormData(prev => {
      const updatedLines = prev.lines.map(line => {
        if (line.id !== id) return line;
        return { ...line, [field]: value };
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
    if (!formData.clientId) { toast('error', "Veuillez sélectionner un client"); return; }
    if (!formData.lines.length) { toast('error', "Veuillez ajouter au moins une ligne"); return; }
    setSaving(true);
    try {
      const payload = {
        clientId: formData.clientId,
        items: formData.lines.map(l => ({
          productId: l.productId,
          montant: l.montant,
        })),
      };
      await axios.post('/api/ventes/avoirs', payload);
      navigate('/dashboard/vente/avoir');
    } catch (err: any) {
      toast('error', err.response?.data?.error || err.response?.data?.details || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }, [formData, navigate]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    return clients.filter(c =>
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(clientSearch.toLowerCase())
    );
  }, [clientSearch, clients]);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.code.toLowerCase().includes(productSearch.toLowerCase())
    );
  }, [productSearch, products]);

  return (
    <DashboardLayout title="Nouveau Bon d'Avoir">
      <div className=" mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard/vente/avoir')} className="p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-purple-600 hover:border-purple-300 transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                <RotateCcw size={28} className="text-purple-600" /> Nouveau Bon d'Avoir
              </h2>
              <p className="text-sm text-gray-400">Créer un avoir client</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={formData.status} />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-violet-500 text-white rounded-lg font-medium shadow-lg shadow-purple-500/25 disabled:opacity-50">
              <Save size={18} /> {saving ? '...' : 'Enregistrer'}
            </motion.button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">N° Avoir</label>
                <input type="text" value={formData.number} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg font-mono font-semibold text-gray-600" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20" />
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <User size={20} className="text-purple-600" />
              <h3 className="font-bold text-gray-700">Informations Client</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative">
                <label className="text-xs font-semibold text-gray-400">Client *</label>
                <div className="relative">
                  <input type="text" value={formData.clientName || formData.clientId} onClick={() => setShowClientDropdown(true)} readOnly placeholder="Sélectionner client..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer focus:ring-2 focus:ring-purple-500/20" />
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <AnimatePresence>
                  {showClientDropdown && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" autoFocus placeholder="Rechercher..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                        </div>
                      </div>
                      {filteredClients.map(client => (
                        <button key={client.id} onClick={() => handleSelectClient(client)} className="w-full px-4 py-3 text-left hover:bg-purple-50 border-b last:border-0">
                          <p className="font-medium text-gray-700">{client.name}</p>
                          <p className="text-xs text-gray-400">{client.code}</p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Nom Client</label>
                <input type="text" value={formData.clientName} readOnly className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-600" />
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200">
            <div className="flex">
              {[
                { id: 'lines' as const, label: 'Lignes Articles', icon: Package },
                { id: 'notes' as const, label: 'Observations', icon: FileText },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${activeTab === tab.id ? 'text-purple-600 border-b-2 border-purple-500 bg-purple-50/50' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                  <tab.icon size={16} /> {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {activeTab === 'lines' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1 relative">
                      <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} onFocus={() => setShowProductDropdown(true)} placeholder="Rechercher un produit..." className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20" />
                      <AnimatePresence>
                        {showProductDropdown && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                            <div className="p-3 border-b border-gray-100 bg-gray-50">
                              <p className="text-xs font-semibold text-gray-400 uppercase">Produits</p>
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                              {filteredProducts.map(product => (
                                <button key={product.id} onClick={() => handleSelectProduct(product)} className="w-full px-4 py-3 text-left hover:bg-purple-50 border-b border-gray-100 last:border-0 flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs">{product.code}</div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-700">{product.name}</p>
                                  </div>
                                  <Plus size={18} className="text-purple-500" />
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleAddLine} className="flex items-center gap-2 px-4 py-3 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 shadow-sm"><Plus size={20} /><span className="hidden sm:inline">Ajouter</span></motion.button>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Produit</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Montant</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider w-12">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {formData.lines.map((line, idx) => (
                        <motion.tr key={line.id} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="hover:bg-gray-50 group">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <input type="text" value={line.code} onChange={(e) => handleUpdateLine(line.id, 'code', e.target.value)} className="w-16 px-2 py-1 text-xs font-mono bg-gray-100 border border-gray-200 rounded" placeholder="CODE" />
                              <input type="text" value={line.designation} onChange={(e) => handleUpdateLine(line.id, 'designation', e.target.value)} className="flex-1 px-2 py-1 text-sm font-medium border border-transparent hover:border-gray-200 rounded focus:border-purple-300 focus:outline-none" placeholder="Nom" />
                            </div>
                          </td>
                          <td className="px-2 py-3"><div className="relative"><input type="number" step="0.01" value={line.montant} onChange={(e) => handleUpdateLine(line.id, 'montant', parseFloat(e.target.value) || 0)} className="w-28 px-2 py-1.5 text-sm text-right bg-white border border-gray-200 rounded-lg focus:border-purple-500 focus:outline-none pr-6" /><span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">DH</span></div></td>
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
                  </div>
                )}

                <div className="bg-purple-50 rounded-xl p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-600">Montant Total de l'Avoir:</span>
                    <span className="text-2xl font-bold text-purple-600">{totalTTC.toFixed(2)} DH</span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'notes' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Observations</label>
                  <textarea value={formData.observation || ''} onChange={(e) => setFormData(prev => ({ ...prev, observation: e.target.value }))} rows={6} placeholder="Notes..." className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500/20 resize-none" />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};
