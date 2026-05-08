import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Plus, Edit2, Trash2, X, Save, ArrowLeft, Percent, Tag, Calendar, Package, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

interface Promotion {
  id: string;
  code: string;
  libelle: string | null;
  type: string;
  valeur: number;
  produitId: string | null;
  dateDebut: string;
  dateFin: string;
  actif: boolean;
  produit?: { id: string; name: string } | null;
}

export const AdminPromotions: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<Promotion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);

  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    type: 'remise',
    valeur: 0,
    produitId: '',
    dateDebut: '',
    dateFin: '',
    actif: true,
  });

  const fetchPromotions = async () => {
    try {
      const res = await axios.get('/api/promotions', { params: { limit: 100 } });
      setPromotions(res.data?.data || res.data || []);
    } catch { setPromotions([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPromotions(); }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('/api/products', { params: { limit: 200 } });
      setProducts((res.data?.data || res.data || []).map((p: any) => ({ id: p.id, name: p.name })));
    } catch { setProducts([]); }
  };

  const filtered = promotions.filter(p =>
    p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.libelle || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setSelected(null);
    setFormData({ code: '', libelle: '', type: 'remise', valeur: 0, produitId: '', dateDebut: '', dateFin: '', actif: true });
    fetchProducts();
    setShowForm(true);
  };

  const handleEdit = (p: Promotion) => {
    setSelected(p);
    setFormData({
      code: p.code,
      libelle: p.libelle || '',
      type: p.type,
      valeur: p.valeur,
      produitId: p.produitId || '',
      dateDebut: p.dateDebut?.split('T')[0] || p.dateDebut,
      dateFin: p.dateFin?.split('T')[0] || p.dateFin,
      actif: p.actif,
    });
    fetchProducts();
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.valeur || !formData.dateDebut || !formData.dateFin) {
      toast('error', 'Code, valeur, dates début et fin sont requis');
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...formData, produitId: formData.produitId || undefined, libelle: formData.libelle || undefined };
      if (selected) {
        await axios.put(`/api/promotions/${selected.id}`, payload);
        toast('success', 'Promotion modifiée');
      } else {
        await axios.post('/api/promotions', payload);
        toast('success', 'Promotion créée');
      }
      setShowForm(false);
      fetchPromotions();
    } catch (e: any) {
      toast('error', e.response?.data?.details || e.response?.data?.error || "Erreur");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: 'Supprimer cette promotion ?'}))) return;
    try {
      await axios.delete(`/api/promotions/${id}`);
      toast('success', 'Promotion supprimée');
      fetchPromotions();
    } catch { toast('error', 'Erreur suppression'); }
  };

  return (
    <DashboardLayout title="Promotions">
      <div className="h-full flex flex-col gap-4">
        {!showForm ? (
          <>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Rechercher promotion..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64" />
                </div>
                <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"><Plus size={18} /><span className="font-bold text-sm">Ajouter</span></button>
              </div>
            </div>
            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="overflow-auto flex-1">
                {loading ? (
                  <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-emerald-500" /></div>
                ) : filtered.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3"><Tag size={48} className="text-gray-300" /><p className="text-gray-400">Aucune promotion</p></div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-emerald-600 sticky top-0">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Code</th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Libellé</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-white border-r border-emerald-500">Type</th>
                        <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Valeur</th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Produit</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-white border-r border-emerald-500">Du</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-white border-r border-emerald-500">Au</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-white border-r border-emerald-500">Actif</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-white">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filtered.map((p, i) => (
                        <motion.tr key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-3 text-sm font-medium text-gray-700">{p.code}</td>
                          <td className="px-3 py-3 text-sm text-gray-700">{p.libelle || '-'}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${p.type === 'remise' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                              {p.type === 'remise' ? '% Remise' : 'Produit gratuit'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right text-sm font-bold text-gray-700">{p.type === 'remise' ? `${p.valeur}%` : `${p.valeur} DH`}</td>
                          <td className="px-3 py-3 text-sm text-gray-500">{p.produit?.name || '-'}</td>
                          <td className="px-3 py-3 text-center text-sm text-gray-600">{new Date(p.dateDebut).toLocaleDateString('fr-FR')}</td>
                          <td className="px-3 py-3 text-center text-sm text-gray-600">{new Date(p.dateFin).toLocaleDateString('fr-FR')}</td>
                          <td className="px-3 py-3 text-center">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${p.actif ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                              {p.actif ? 'Oui' : 'Non'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                              <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Percent size={24} />
                  <div>
                    <h2 className="text-lg font-bold">{selected ? 'Modifier Promotion' : 'Nouvelle Promotion'}</h2>
                    <p className="text-emerald-100 text-sm">{selected ? `Code: ${selected.code}` : 'Création d\'une promotion'}</p>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"><ArrowLeft size={18} /> Retour</button>
              </div>
            </div>
            <div className="p-6 flex-1 overflow-auto">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Code *</label>
                  <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="PROMO001" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Libellé</label>
                  <input type="text" value={formData.libelle} onChange={(e) => setFormData({ ...formData, libelle: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Soldes été" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Type *</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="remise">Remise (%)</option>
                    <option value="produit_gratuit">Produit gratuit</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Valeur *</label>
                  <input type="number" step="0.01" value={formData.valeur} onChange={(e) => setFormData({ ...formData, valeur: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Produit (optionnel)</label>
                  <select value={formData.produitId} onChange={(e) => setFormData({ ...formData, produitId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                    <option value="">Tous les produits</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Actif</label>
                  <div className="flex gap-3 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="actif" checked={formData.actif} onChange={() => setFormData({ ...formData, actif: true })} className="text-emerald-600" /> Oui
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="actif" checked={!formData.actif} onChange={() => setFormData({ ...formData, actif: false })} className="text-rose-600" /> Non
                    </label>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Date début *</label>
                  <input type="date" value={formData.dateDebut} onChange={(e) => setFormData({ ...formData, dateDebut: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600">Date fin *</label>
                  <input type="date" value={formData.dateFin} onChange={(e) => setFormData({ ...formData, dateFin: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 pt-6 border-t border-gray-200">
                <button onClick={handleSave} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold disabled:opacity-50"><Save size={18} /> {submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 px-6 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-bold"><X size={18} /> Annuler</button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};
