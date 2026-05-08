import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  Plus, Search, FileText, Eye, Trash2, Printer,
  CheckCircle2, XCircle, Clock, AlertCircle, CreditCard, Calendar, ArrowUpDown
} from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useConfirm } from '../contexts/ConfirmContext';

interface Invoice {
  id: string;
  reference: string;
  date: string;
  clientId: string;
  client?: { id: string; code: string; name: string; city?: string };
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  dueDate?: string;
  statut: string;
  paymentMode?: string;
  createdAt: string;
}

export const FacturesModern: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'reference' | 'total'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchData = async () => {
    try { const res = await axios.get('/api/ventes/factures'); setInvoices(res.data.data || res.data); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => ({
    total: invoices.length,
    paid: invoices.filter(i => i.statut === 'payée').length,
    unpaid: invoices.filter(i => i.statut === 'impayée').length,
    totalAmount: invoices.reduce((a, i) => a + i.totalTTC, 0),
  }), [invoices]);

  const filtered = useMemo(() => {
    let r = [...invoices];
    if (searchQuery) { const q = searchQuery.toLowerCase(); r = r.filter(i => i.reference.toLowerCase().includes(q) || (i.client?.name || '').toLowerCase().includes(q)); }
    if (statusFilter !== 'all') r = r.filter(i => i.statut === statusFilter);
    r.sort((a, b) => { let c = 0; if (sortBy === 'date') c = new Date(a.date).getTime() - new Date(b.date).getTime(); else if (sortBy === 'reference') c = a.reference.localeCompare(b.reference); else c = a.totalTTC - b.totalTTC; return sortOrder === 'asc' ? c : -c; });
    return r;
  }, [invoices, searchQuery, statusFilter, sortBy, sortOrder]);

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: 'Supprimer cette facture ?'}))) return;
    try { await axios.delete(`/api/ventes/factures/${id}`); await fetchData(); }
    catch { /* ignore */ }
  };

  const Badge = ({ statut }: { statut: string }) => {
    const config: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
      payée: { label: 'Payée', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle2 size={14} /> },
      impayée: { label: 'Impayée', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <Clock size={14} /> },
      partielle: { label: 'Partielle', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <AlertCircle size={14} /> },
    };
    const c = config[statut] || config.impayée;
    return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${c.color}`}>{c.icon}{c.label}</span>;
  };

  return (
    <DashboardLayout title="Factures Clients">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Total Factures', value: stats.total, icon: FileText, color: 'from-blue-500 to-cyan-500' },
            { label: 'Payées', value: stats.paid, icon: CheckCircle2, color: 'from-emerald-500 to-teal-500' },
            { label: 'Impayées', value: stats.unpaid, icon: AlertCircle, color: 'from-amber-500 to-orange-500' },
            { label: 'Montant Total', value: `${stats.totalAmount.toLocaleString('fr-FR')} DH`, icon: CreditCard, color: 'from-violet-500 to-purple-500' },
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
              <input type="text" placeholder="Rechercher facture..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm">
              <option value="all">Tous les statuts</option>
              <option value="impayée">Impayée</option>
              <option value="partielle">Partielle</option>
              <option value="payée">Payée</option>
            </select>
          </div>
          <button onClick={() => navigate('/dashboard/vente/factures/nouveau')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium shadow-lg">
            <Plus size={18} /> Nouvelle Facture
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div> : (
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-3 py-3 text-left"><button onClick={() => { setSortBy('reference'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase">Réf <ArrowUpDown size={12} /></button></th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Client</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Total TTC</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Statut</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((inv, i) => (
                  <motion.tr key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3"><span className="font-mono text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">{inv.reference}</span></td>
                    <td className="px-3 py-3 text-sm text-gray-600">{new Date(inv.date).toLocaleDateString('fr-FR')}</td>
                    <td className="px-3 py-3"><span className="text-sm font-medium text-gray-700">{inv.client?.name || '-'}</span></td>
                    <td className="px-3 py-3 text-right"><span className="text-sm font-bold text-gray-700">{inv.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</span></td>
                    <td className="px-3 py-3 text-center"><Badge statut={inv.statut} /></td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => navigate(`/dashboard/vente/factures/${inv.id}`)} className="p-1.5 rounded hover:bg-gray-100 text-slate-400 hover:text-emerald-600"><Eye size={16} /></button>
                        <button onClick={() => handleDelete(inv.id)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
          {filtered.length === 0 && !loading && (
            <div className="p-12 text-center"><div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gray-100 flex items-center justify-center"><FileText size={32} className="text-slate-400" /></div><p className="text-gray-400 font-medium">Aucune facture trouvée</p></div>
          )}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50"><p className="text-sm text-gray-400">Affichage de <span className="font-semibold text-gray-600">{filtered.length}</span> sur {invoices.length}</p></div>
        </div>
      </div>
    </DashboardLayout>
  );
};
