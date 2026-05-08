import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Plus, Edit2, Trash2, X, Package, Save, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useConfirm } from '../contexts/ConfirmContext';

interface Produit {
  id: string;
  code: string;
  name: string;
  brand: string | null;
  familleId: string | null;
  sousFamilleId: string | null;
  tvaId: string | null;
  depotId: string | null;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  stockMin: number;
  isActif: boolean;
  famille?: { id: string; nom: string } | null;
  sousFamille?: { id: string; nom: string } | null;
  tva?: { id: string; taux: number; libelle: string } | null;
  depot?: { id: string; nom: string } | null;
}

interface Famille { id: string; nom: string }
interface TVAItem { id: string; taux: number; libelle: string }

export const Produits: React.FC = () => {
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedProduit, setSelectedProduit] = useState<Produit | null>(null);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [familles, setFamilles] = useState<Famille[]>([]);
  const [tvas, setTvas] = useState<TVAItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '', name: '', brand: '', unit: 'Unité', buyPrice: 0, sellPrice: 0,
    stock: 0, stockMin: 0, familleId: '', sousFamilleId: '', tvaId: '', depotId: '',
  });

  const fetchProduits = async () => {
    try { const res = await axios.get('/api/products'); setProduits(res.data.data || res.data); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchOptions = async () => {
    try {
      const [fRes, tRes] = await Promise.all([
        axios.get('/api/parametres/familles'),
        axios.get('/api/parametres/tva'),
      ]);
      setFamilles(fRes.data.data || fRes.data);
      setTvas(tRes.data.data || tRes.data);
    } catch { /* ignore */ }
  };

  useEffect(() => { fetchProduits(); fetchOptions(); }, []);

  const filteredProduits = produits.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedProduit(null);
    setFormData({ code: '', name: '', brand: '', unit: 'Unité', buyPrice: 0, sellPrice: 0, stock: 0, stockMin: 0, familleId: '', sousFamilleId: '', tvaId: '', depotId: '' });
    setShowForm(true);
  };

  const handleEdit = (p: Produit) => {
    setSelectedProduit(p);
    setFormData({
      code: p.code, name: p.name, brand: p.brand || '', unit: p.unit,
      buyPrice: p.buyPrice, sellPrice: p.sellPrice, stock: p.stock, stockMin: p.stockMin,
      familleId: p.familleId || '', sousFamilleId: p.sousFamilleId || '',
      tvaId: p.tvaId || '', depotId: p.depotId || '',
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      if (selectedProduit) await axios.put(`/api/products/${selectedProduit.id}`, formData);
      else await axios.post('/api/products', formData);
      await fetchProduits(); setShowForm(false);
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: 'Supprimer ce produit ?'}))) return;
    try { await axios.delete(`/api/products/${id}`); await fetchProduits(); }
    catch { /* ignore */ }
  };

  return (
    <DashboardLayout title="Gestion des Produits">
      <div className="h-full flex flex-col gap-4">
        {!showForm ? (
          <>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Rechercher produit..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64" />
                  </div>
                </div>
                <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"><Plus size={18} /><span className="font-bold text-sm">Ajouter</span></button>
              </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="overflow-auto flex-1">
                {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div> : (
                <table className="w-full">
                  <thead className="bg-emerald-600 sticky top-0">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Code</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Libellé</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Famille</th>
                      <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Unité</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">P.U. Achat</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">P.U. Vente</th>
                      <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Stock</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-white border-r border-emerald-500">TVA</th>
                      <th className="px-3 py-3 text-center text-xs font-bold text-white">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProduits.map((p, index) => (
                      <tr key={p.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-3 text-sm font-medium text-gray-700">{p.code}</td>
                        <td className="px-3 py-3 text-sm text-gray-700">{p.name}</td>
                        <td className="px-3 py-3 text-sm text-gray-500">{p.famille?.nom || '-'}</td>
                        <td className="px-3 py-3 text-sm text-center text-gray-500">{p.unit}</td>
                        <td className="px-3 py-3 text-sm text-right text-gray-500">{p.buyPrice.toFixed(2)}</td>
                        <td className="px-3 py-3 text-sm text-right font-medium text-emerald-700">{p.sellPrice.toFixed(2)}</td>
                        <td className={`px-3 py-3 text-sm text-right font-medium ${p.stock <= p.stockMin ? 'text-red-600' : 'text-gray-700'}`}>{p.stock}</td>
                        <td className="px-3 py-3 text-sm text-center text-gray-500">{p.tva ? `${p.tva.taux}%` : '-'}</td>
                        <td className="px-3 py-3 text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => handleEdit(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button><button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                )}
              </div>
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-500">Total: <span className="font-bold">{filteredProduits.length}</span> produits</div>
              </div>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package size={24} />
                  <div><h2 className="text-lg font-bold">{selectedProduit ? 'Modifier Produit' : 'Nouveau Produit'}</h2><p className="text-emerald-100 text-sm">{selectedProduit ? `Code: ${selectedProduit.code}` : "Création d'un nouveau produit"}</p></div>
                </div>
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"><ArrowLeft size={18} /> Retour</button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-4">Informations Générales</h3>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Code Produit:</label><input type="text" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="PR00X" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Libellé:</label><input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Nom du produit" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Marque:</label><input type="text" value={formData.brand} onChange={e => setFormData({ ...formData, brand: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Unité:</label><input type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-4">Classification</h3>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Famille:</label><select value={formData.familleId} onChange={e => setFormData({ ...formData, familleId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="">Sélectionner...</option>{familles.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}</select></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-600">TVA:</label><select value={formData.tvaId} onChange={e => setFormData({ ...formData, tvaId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="">Sélectionner...</option>{tvas.map(t => <option key={t.id} value={t.id}>{t.libelle} ({t.taux}%)</option>)}</select></div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-4">Prix & Stock</h3>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-600">P.U. Achat:</label><input type="number" step="0.01" value={formData.buyPrice} onChange={e => setFormData({ ...formData, buyPrice: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-600">P.U. Vente:</label><input type="number" step="0.01" value={formData.sellPrice} onChange={e => setFormData({ ...formData, sellPrice: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Stock Actuel:</label><input type="number" value={formData.stock} onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                  <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Stock Min:</label><input type="number" value={formData.stockMin} onChange={e => setFormData({ ...formData, stockMin: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
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
