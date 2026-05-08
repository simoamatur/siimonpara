import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  Plus, Search, CreditCard, Eye, Trash2, ArrowUpDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useConfirm } from '../contexts/ConfirmContext';

interface Reglement {
  id: string;
  reference: string;
  date: string;
  clientId: string;
  client?: { id: string; code: string; name: string };
  montant: number;
  modePaiementId?: string;
  modePaiement?: { id: string; nom: string };
  referenceChèque?: string;
  createdAt: string;
}

export const ReglementsModern: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [items, setItems] = useState<Reglement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    try { const res = await axios.get('/api/ventes/reglements'); setItems(res.data.data || res.data); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => ({
    total: items.length,
    totalAmount: items.reduce((a, i) => a + i.montant, 0),
  }), [items]);

  const filtered = useMemo(() => {
    if (!searchQuery) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(i => i.reference.toLowerCase().includes(q) || (i.client?.name || '').toLowerCase().includes(q));
  }, [items, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: 'Supprimer ce règlement ?'}))) return;
    try { await axios.delete(`/api/ventes/reglements/${id}`); await fetchData(); }
    catch { /* ignore */ }
  };

  return (
    <DashboardLayout title="Règlements Clients">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: 'Total Règlements', value: stats.total, icon: CreditCard, color: 'from-blue-500 to-cyan-500' },
            { label: 'Montant Total', value: `${stats.totalAmount.toLocaleString('fr-FR')} DH`, icon: CreditCard, color: 'from-emerald-500 to-teal-500' },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="relative overflow-hidden rounded-xl bg-white border border-gray-200 p-4">
              <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${s.color} opacity-10 rounded-bl-full`} />
              <div className="flex items-start justify-between">
                <div><p className="text-xs text-gray-400 font-medium">{s.label}</p><p className="text-lg font-bold text-gray-700 mt-1">{s.value}</p></div>
                <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center text-white`}><s.icon size={16} /></div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input type="text" placeholder="Rechercher règlement..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
          </div>
          <button onClick={() => navigate('/dashboard/vente/reglements/nouveau')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium shadow-lg">
            <Plus size={18} /> Nouveau Règlement
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div> : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Réf</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Client</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Mode</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Montant</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item, i) => (
                  <motion.tr key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3"><span className="font-mono text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">{item.reference}</span></td>
                    <td className="px-3 py-3 text-sm text-gray-600">{new Date(item.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-3 py-3"><span className="text-sm font-medium text-gray-700">{item.client?.name || '-'}</span></td>
                    <td className="px-3 py-3 text-sm text-gray-500">{item.modePaiement?.nom || '-'}</td>
                    <td className="px-3 py-3 text-right"><span className="text-sm font-bold text-emerald-600">{item.montant.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</span></td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
          {filtered.length === 0 && !loading && (
            <div className="p-12 text-center"><div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gray-100 flex items-center justify-center"><CreditCard size={32} className="text-slate-400" /></div><p className="text-gray-400 font-medium">Aucun règlement trouvé</p></div>
          )}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50"><p className="text-sm text-gray-400">Affichage de <span className="font-semibold text-gray-600">{filtered.length}</span> sur {items.length}</p></div>
        </div>
      </div>
    </DashboardLayout>
  );
};
