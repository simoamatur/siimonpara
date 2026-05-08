import React, { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Plus, Edit2, Trash2, Eye, X, Save, ArrowLeft, Users, Phone, Mail, Building2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useConfirm } from '../contexts/ConfirmContext';

interface Client {
  id: string;
  code: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zoneId: string | null;
  categorieId: string | null;
  groupeRemiseId: string | null;
  discountRate: number;
  creditPlafond: number;
  solde: number;
  isActif: boolean;
  zone?: { id: string; nom: string } | null;
  categorie?: { id: string; nom: string } | null;
  ville?: { id: string; nom: string } | null;
  groupeRemise?: { id: string; nom: string } | null;
}

type FormMode = 'list' | 'create' | 'edit';

export const Clients: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [mode, setMode] = useState<FormMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '', name: '', email: '', phone: '', address: '', city: '',
    zoneId: '', categorieId: '', discountRate: 0, creditPlafond: 0,
  });

  const fetchClients = async () => {
    try { const res = await axios.get('/api/clients'); setClients(res.data.data || res.data); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClients(); }, []);

  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.city || '').toLowerCase().includes(q)
    );
  }, [clients, searchQuery]);

  const stats = useMemo(() => ({
    total: clients.length,
    active: clients.filter(c => c.isActif).length,
    totalSolde: clients.reduce((acc, c) => acc + c.solde, 0),
  }), [clients]);

  const handleCreate = () => {
    setSelectedClient(null);
    setFormData({ code: '', name: '', email: '', phone: '', address: '', city: '', zoneId: '', categorieId: '', discountRate: 0, creditPlafond: 0 });
    setMode('create');
  };

  const handleEdit = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      code: client.code, name: client.name, email: client.email || '', phone: client.phone || '',
      address: client.address || '', city: client.city || '', zoneId: client.zoneId || '',
      categorieId: client.categorieId || '', discountRate: client.discountRate, creditPlafond: client.creditPlafond,
    });
    setMode('edit');
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      if (mode === 'create') {
        await axios.post('/api/clients', formData);
      } else if (selectedClient) {
        await axios.put(`/api/clients/${selectedClient.id}`, formData);
      }
      await fetchClients();
      setMode('list');
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: 'Supprimer ce client ?'}))) return;
    try { await axios.delete(`/api/clients/${id}`); await fetchClients(); }
    catch { /* ignore */ }
  };

  const updateField = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const renderList = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Total Clients</p><p className="text-2xl font-bold text-gray-800">{stats.total}</p></div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white"><Users size={24} /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Clients Actifs</p><p className="text-2xl font-bold text-emerald-600">{stats.active}</p></div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white"><Users size={24} /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Solde Total</p><p className="text-2xl font-bold text-gray-800">{stats.totalSolde.toLocaleString('fr-FR')} DH</p></div>
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 text-white"><Building2 size={24} /></div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Liste des Clients</h2>
            <button onClick={handleCreate} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"><Plus size={18} /> Nouveau</button>
          </div>
        </div>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 pr-3 py-2 w-56 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
            </div>
          </div>
          {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div> : (
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full">
              <thead className="bg-gray-100"><tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Code</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Client</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Ville</th>
                <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">Solde</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Statut</th>
                <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Action</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3"><span className="font-mono text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">{c.code}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">{c.name.charAt(0)}</div>
                        <div><p className="font-semibold text-gray-700">{c.name}</p><p className="text-xs text-gray-400">{c.ville?.nom || c.city || '-'}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-sm text-gray-500 flex items-center gap-1.5"><Phone size={12} className="text-emerald-500" />{c.phone || '-'}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5"><Mail size={12} className="text-emerald-500" />{c.email || '-'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{c.categorie?.nom || '-'}</td>
                    <td className="px-4 py-3 text-right"><span className={`font-semibold ${c.solde >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{c.solde.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</span></td>
                    <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-medium ${c.isActif ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{c.isActif ? 'Actif' : 'Inactif'}</span></td>
                    <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => navigate(`/dashboard/param/clients/${c.id}`)} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Voir fiche"><Eye size={16} /></button><button onClick={() => handleEdit(c)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Modifier"><Edit2 size={16} /></button><button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Supprimer"><Trash2 size={16} /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderForm = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => setMode('list')} className="p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-emerald-600 hover:border-emerald-500/30 transition-all"><ArrowLeft size={20} /></button>
        <div><h2 className="text-xl font-bold text-gray-700">{mode === 'create' ? 'Nouveau Client' : 'Modifier Client'}</h2><p className="text-sm text-gray-400">{mode === 'edit' ? `Code: ${selectedClient?.code}` : 'Créer un nouveau client'}</p></div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-6 py-4"><h2 className="text-lg font-bold">Informations Client</h2></div>
        <div className="p-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Code Client:</label><input type="text" value={formData.code} onChange={e => updateField('code', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="CL001" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Raison Sociale:</label><input type="text" value={formData.name} onChange={e => updateField('name', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Nom du client" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Adresse:</label><input type="text" value={formData.address} onChange={e => updateField('address', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Adresse complète" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Ville:</label><input type="text" value={formData.city} onChange={e => updateField('city', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Ville" /></div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Téléphone:</label><input type="text" value={formData.phone} onChange={e => updateField('phone', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="05XX123456" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Email:</label><input type="email" value={formData.email} onChange={e => updateField('email', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="email@exemple.ma" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Plafond de Crédit (DH):</label><input type="number" value={formData.creditPlafond} onChange={e => updateField('creditPlafond', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0.00" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Taux Remise (%):</label><input type="number" value={formData.discountRate} onChange={e => updateField('discountRate', parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0" /></div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
              <button onClick={() => setMode('list')} className="flex items-center gap-2 px-6 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-bold"><X size={18} /> Annuler</button>
              <button onClick={handleSave} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold disabled:opacity-50"><Save size={18} /> {submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <DashboardLayout title="Gestion des Clients">
      <AnimatePresence mode="wait">
        {mode === 'list' ? renderList() : renderForm()}
      </AnimatePresence>
    </DashboardLayout>
  );
};
