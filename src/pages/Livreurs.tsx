import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Plus, Edit2, Trash2, X, Truck, Save, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useConfirm } from '../contexts/ConfirmContext';

interface Livreur {
  id: string;
  nom: string;
  telephone: string | null;
  vehicule: string | null;
  zoneId: string | null;
  isActif: boolean;
  zone?: { id: string; nom: string };
}

interface Zone {
  id: string;
  nom: string;
}

export const Livreurs: React.FC = () => {
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedLivreur, setSelectedLivreur] = useState<Livreur | null>(null);
  const [items, setItems] = useState<Livreur[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Livreur>>({ nom: '', telephone: '', vehicule: '', zoneId: '', isActif: true });

  const fetchData = async () => {
    try { const res = await axios.get('/api/parametres/livreurs'); setItems(res.data.data || res.data); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchZones = async () => {
    try { const res = await axios.get('/api/parametres/zones'); setZones(res.data.data || res.data); }
    catch { /* ignore */ }
  };

  useEffect(() => { fetchData(); fetchZones(); }, []);

  const filtered = items.filter(i =>
    i.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => { setSelectedLivreur(null); setFormData({ nom: '', telephone: '', vehicule: '', zoneId: '', isActif: true }); setShowForm(true); };
  const handleEdit = (v: Livreur) => { setSelectedLivreur(v); setFormData({ nom: v.nom, telephone: v.telephone || '', vehicule: v.vehicule || '', zoneId: v.zoneId || '', isActif: v.isActif }); setShowForm(true); };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      if (selectedLivreur) await axios.put(`/api/parametres/livreurs/${selectedLivreur.id}`, formData);
      else await axios.post('/api/parametres/livreurs', formData);
      await fetchData(); setShowForm(false);
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: 'Supprimer ce livreur ?'}))) return;
    try { await axios.delete(`/api/parametres/livreurs/${id}`); await fetchData(); }
    catch { /* ignore */ }
  };

  return (
    <DashboardLayout title="Gestion des Livreurs">
      <div className=" mx-auto">
        {!showForm ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><Truck size={24} /><h2 className="text-lg font-bold">Livreurs</h2></div>
                <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"><Plus size={18} /> Nouveau</button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Rechercher livreur..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full" /></div>
              </div>
              {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div> : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-100"><tr><th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Nom</th><th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Téléphone</th><th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Véhicule</th><th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Zone</th><th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Statut</th><th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Action</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">{v.nom}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{v.telephone || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{v.vehicule || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{v.zone?.nom || '-'}</td>
                        <td className="px-4 py-3 text-center">{v.isActif ? <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Actif</span> : <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">Inactif</span>}</td>
                        <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => handleEdit(v)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button><button onClick={() => handleDelete(v.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><Truck size={24} /><h2 className="text-lg font-bold">{selectedLivreur ? 'Modifier Livreur' : 'Nouveau Livreur'}</h2></div>
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"><ArrowLeft size={18} /> Retour</button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Nom:</label><input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Téléphone:</label><input type="text" value={formData.telephone || ''} onChange={(e) => setFormData({ ...formData, telephone: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Véhicule:</label><input type="text" value={formData.vehicule || ''} onChange={(e) => setFormData({ ...formData, vehicule: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Zone:</label><select value={formData.zoneId || ''} onChange={(e) => setFormData({ ...formData, zoneId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="">Sélectionner...</option>{zones.map(z => <option key={z.id} value={z.id}>{z.nom}</option>)}</select></div>
                <div className="space-y-2 flex items-center gap-4 pt-6"><label className="flex items-center gap-2"><input type="checkbox" checked={formData.isActif} onChange={(e) => setFormData({ ...formData, isActif: e.target.checked })} className="w-4 h-4 text-emerald-600" /><span className="text-sm text-gray-600">Actif</span></label></div>
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
