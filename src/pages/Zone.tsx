import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Plus, Edit2, Trash2, X, MapPin, Save, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useConfirm } from '../contexts/ConfirmContext';

interface Zone {
  id: string;
  nom: string;
  villeId: string;
  ville?: { id: string; nom: string };
}

interface Ville {
  id: string;
  nom: string;
}

export const Zone: React.FC = () => {
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [zones, setZones] = useState<Zone[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Zone>>({ nom: '', villeId: '' });

  const fetchZones = async () => {
    try { const res = await axios.get('/api/parametres/zones'); setZones(res.data.data || res.data); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchVilles = async () => {
    try { const res = await axios.get('/api/parametres/villes'); setVilles(res.data.data || res.data); }
    catch { /* ignore */ }
  };

  useEffect(() => { fetchZones(); fetchVilles(); }, []);

  const filtered = zones.filter(z =>
    z.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedZone(null);
    setFormData({ nom: '', villeId: '' });
    setShowForm(true);
  };

  const handleEdit = (z: Zone) => {
    setSelectedZone(z);
    setFormData({ nom: z.nom, villeId: z.villeId });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      if (selectedZone) await axios.put(`/api/parametres/zones/${selectedZone.id}`, formData);
      else await axios.post('/api/parametres/zones', formData);
      await fetchZones(); setShowForm(false);
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: 'Supprimer cette zone ?'}))) return;
    try { await axios.delete(`/api/parametres/zones/${id}`); await fetchZones(); }
    catch { /* ignore */ }
  };

  return (
    <DashboardLayout title="Zones">
      <div className=" mx-auto">
        {!showForm ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><MapPin size={24} /><h2 className="text-lg font-bold">Zones de Livraison</h2></div>
                <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"><Plus size={18} /> Nouveau</button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Rechercher zone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full" /></div>
              </div>
              {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div> : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-100"><tr><th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Nom</th><th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Ville</th><th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Action</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((z) => (
                      <tr key={z.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-700">{z.nom}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{z.ville?.nom || '-'}</td>
                        <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => handleEdit(z)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button><button onClick={() => handleDelete(z.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button></div></td>
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
                <div className="flex items-center gap-3"><MapPin size={24} /><h2 className="text-lg font-bold">{selectedZone ? 'Modifier Zone' : 'Nouvelle Zone'}</h2></div>
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"><ArrowLeft size={18} /> Retour</button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Nom:</label><input type="text" value={formData.nom} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Ville:</label><select value={formData.villeId} onChange={(e) => setFormData({ ...formData, villeId: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="">Sélectionner...</option>{villes.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}</select></div>
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
