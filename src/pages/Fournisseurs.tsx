import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  Search, Plus, Edit2, Trash2, X, Truck, Phone, Mail, Building2,
  ChevronLeft, ChevronRight, Save, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useConfirm } from '../contexts/ConfirmContext';

interface Fournisseur {
  id: string;
  code: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  adresse: string | null;
  villeId: string | null;
  zoneId: string | null;
  solde: number;
  isActif: boolean;
  ville?: { id: string; nom: string } | null;
}

interface Ville { id: string; nom: string }

type FormMode = 'list' | 'create' | 'edit';

export const Fournisseurs: React.FC = () => {
  const confirm = useConfirm();
  const [mode, setMode] = useState<FormMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [villes, setVilles] = useState<Ville[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '', nom: '', email: '', telephone: '', adresse: '', villeId: '',
  });

  const fetchFournisseurs = async () => {
    try { const res = await axios.get('/api/parametres/fournisseurs'); setFournisseurs(res.data.data || res.data); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const fetchVilles = async () => {
    try { const res = await axios.get('/api/parametres/villes'); setVilles(res.data.data || res.data); }
    catch { /* ignore */ }
  };

  useEffect(() => { fetchFournisseurs(); fetchVilles(); }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return fournisseurs.filter(f =>
      f.nom.toLowerCase().includes(q) || f.code.toLowerCase().includes(q)
    );
  }, [fournisseurs, searchQuery]);

  const stats = useMemo(() => ({
    total: fournisseurs.length,
    active: fournisseurs.filter(f => f.isActif).length,
    totalSolde: fournisseurs.reduce((acc, f) => acc + f.solde, 0),
  }), [fournisseurs]);

  const handleCreate = () => {
    setSelectedFournisseur(null);
    setFormData({ code: '', nom: '', email: '', telephone: '', adresse: '', villeId: '' });
    setMode('create');
  };

  const handleEdit = (f: Fournisseur) => {
    setSelectedFournisseur(f);
    setFormData({ code: f.code, nom: f.nom, email: f.email || '', telephone: f.telephone || '', adresse: f.adresse || '', villeId: f.villeId || '' });
    setMode('edit');
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      if (mode === 'create') await axios.post('/api/parametres/fournisseurs', formData);
      else if (selectedFournisseur) await axios.put(`/api/parametres/fournisseurs/${selectedFournisseur.id}`, formData);
      await fetchFournisseurs(); setMode('list');
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: 'Désactiver ce fournisseur ?'}))) return;
    try { await axios.put(`/api/parametres/fournisseurs/${id}`, { isActif: false }); await fetchFournisseurs(); }
    catch { /* ignore */ }
  };

  const updateField = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const StatusBadge: React.FC<{ actif: boolean }> = ({ actif }) => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
      actif ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${actif ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
      {actif ? 'Actif' : 'Inactif'}
    </span>
  );

  const renderList = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Fournisseurs', value: stats.total, icon: Truck, color: 'from-blue-500 to-cyan-500' },
          { label: 'Fournisseurs Actifs', value: stats.active, icon: Building2, color: 'from-emerald-500 to-teal-500' },
          { label: 'Solde Total', value: `${stats.totalSolde.toLocaleString('fr-FR')} DH`, icon: Building2, color: 'from-violet-500 to-purple-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-5 shadow-sm"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full`} />
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}><stat.icon size={24} /></div>
              <div><p className="text-sm text-gray-400 font-medium">{stat.label}</p><p className="text-2xl font-bold text-gray-700">{stat.value}</p></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Rechercher fournisseur..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2.5 w-64 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
        </div>
        <button onClick={handleCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all">
          <Plus size={18} /><span>Nouveau Fournisseur</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div> : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Code</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fournisseur</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</th>
                <th className="px-4 py-3.5 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ville</th>
                <th className="px-4 py-3.5 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Solde</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-3.5 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((f, index) => (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-4"><span className="font-mono text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">{f.code}</span></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">{f.nom.charAt(0)}</div>
                      <div><p className="font-semibold text-gray-700">{f.nom}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-500 flex items-center gap-1.5"><Phone size={12} className="text-blue-500" />{f.telephone || '-'}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5"><Mail size={12} className="text-blue-500" />{f.email || '-'}</p>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500">{f.ville?.nom || '-'}</td>
                  <td className="px-4 py-4 text-right"><span className={`font-semibold ${f.solde >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{f.solde.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</span></td>
                  <td className="px-4 py-4 text-center"><StatusBadge actif={f.isActif} /></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleEdit(f)} className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(f.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
        {filtered.length === 0 && !loading && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 flex items-center justify-center"><Truck size={32} className="text-slate-400" /></div>
            <p className="text-gray-400 font-medium">Aucun fournisseur trouvé</p>
          </div>
        )}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-400">Affichage de <span className="font-semibold text-gray-600">{filtered.length}</span> fournisseurs</p>
        </div>
      </div>
    </div>
  );

  const renderForm = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setMode('list')} className="p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-emerald-600 hover:border-emerald-500/30 transition-all"><ArrowLeft size={20} /></button>
        <div><h2 className="text-xl font-bold text-gray-700">{mode === 'create' ? 'Nouveau Fournisseur' : 'Modifier Fournisseur'}</h2><p className="text-sm text-gray-400">{mode === 'edit' ? `Code: ${selectedFournisseur?.code}` : 'Créer un nouveau fournisseur'}</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-cyan-50/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shadow-lg"><Truck size={24} /></div>
            <div><h3 className="font-bold text-gray-700">Informations Fournisseur</h3><p className="text-sm text-gray-400">Remplissez les informations du fournisseur</p></div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2"><Building2 size={14} /> Informations Générales</h4>
              <div className="space-y-2"><label className="text-sm font-medium text-gray-500">Code Fournisseur:</label><input type="text" value={formData.code} onChange={e => updateField('code', e.target.value)} placeholder="FR001" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-gray-500">Raison Sociale:</label><input type="text" value={formData.nom} onChange={e => updateField('nom', e.target.value)} placeholder="Nom du fournisseur" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-gray-500">Adresse:</label><input type="text" value={formData.adresse} onChange={e => updateField('adresse', e.target.value)} placeholder="Adresse complète" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-gray-500">Ville:</label><select value={formData.villeId} onChange={e => updateField('villeId', e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"><option value="">Sélectionner...</option>{villes.map(v => <option key={v.id} value={v.id}>{v.nom}</option>)}</select></div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-600 uppercase tracking-wider flex items-center gap-2"><Phone size={14} /> Contact</h4>
              <div className="space-y-2"><label className="text-sm font-medium text-gray-500">Téléphone:</label><input type="text" value={formData.telephone} onChange={e => updateField('telephone', e.target.value)} placeholder="05XX123456" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" /></div>
              <div className="space-y-2"><label className="text-sm font-medium text-gray-500">Email:</label><input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} placeholder="email@exemple.ma" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" /></div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button onClick={() => setMode('list')} className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-medium hover:bg-gray-50 transition-all">Annuler</button>
            <button onClick={handleSave} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all disabled:opacity-50"><Save size={18} /> {submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <DashboardLayout title="Gestion des Fournisseurs">
      <AnimatePresence mode="wait">
        {mode === 'list' ? renderList() : renderForm()}
      </AnimatePresence>
    </DashboardLayout>
  );
};
