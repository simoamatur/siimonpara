import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Package, ArrowRightLeft, ArrowUpRight, ArrowDownRight, Calendar, Warehouse, FileText, Hash, ChevronLeft, ChevronRight, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface Mouvement {
  id: string;
  type: string;
  quantite: number;
  prixUnitaire: number | null;
  documentRef: string | null;
  motif: string | null;
  date: string;
  createdAt: string;
  product: { id: string; code: string; name: string };
  depot: { id: string; nom: string } | null;
}

export const MouvementStock: React.FC = () => {
  const navigate = useNavigate();
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchMouvements = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/stock/mouvements', { params: { page, limit } });
      setMouvements(res.data?.data || []);
      setTotal(res.data?.total || 0);
    } catch { setMouvements([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchMouvements(); }, [page]);

  const filtered = mouvements.filter(m => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return m.product?.name?.toLowerCase().includes(q) || m.product?.code?.toLowerCase().includes(q) || m.documentRef?.toLowerCase().includes(q);
    }
    return true;
  });

  const stats = {
    total: mouvements.reduce((s, m) => s + m.quantite, 0),
    entrees: mouvements.filter(m => m.type === 'entrée').reduce((s, m) => s + m.quantite, 0),
    sorties: mouvements.filter(m => m.type === 'sortie').reduce((s, m) => s + m.quantite, 0),
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <DashboardLayout title="Mouvements de Stock">
      <div className="h-full flex flex-col gap-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Mouvements', value: mouvements.length, sub: `${stats.total} unités`, icon: <RefreshCw size={22} className="text-blue-600" />, color: 'from-blue-500/10 to-blue-600/5 border-blue-200/50' },
            { label: 'Entrées', value: stats.entrees, icon: <ArrowDownRight size={22} className="text-emerald-600" />, color: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/50' },
            { label: 'Sorties', value: stats.sorties, icon: <ArrowUpRight size={22} className="text-rose-600" />, color: 'from-rose-500/10 to-rose-600/5 border-rose-200/50' },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${card.color} border p-5`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.label}</p>
                  <p className="mt-1 text-2xl font-bold text-gray-800">{card.value}</p>
                  {card.sub && <p className="mt-1 text-xs text-gray-500">{card.sub}</p>}
                </div>
                <div className="p-2.5 rounded-xl bg-white/60 backdrop-blur-sm">{card.icon}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="Rechercher mouvement..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64" />
              </div>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="all">Tous types</option>
                <option value="entrée">Entrées</option>
                <option value="sortie">Sorties</option>
                <option value="correction">Corrections</option>
              </select>
            </div>
            <button onClick={() => navigate('/dashboard/stock/mouvement/nouveau')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"><Plus size={18} /><span className="font-bold text-sm">Nouveau Mouvement</span></button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-emerald-500" /></div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Package size={48} className="text-gray-300" />
                <p className="text-gray-400 text-sm">Aucun mouvement trouvé</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-100 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Produit</th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Type</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">Quantité</th>
                    <th className="px-4 py-3 text-right text-xs font-bold text-gray-600">Prix U.</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Dépôt</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Document</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Motif</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((m, i) => (
                    <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Calendar size={14} className="text-gray-400" />
                          {new Date(m.date).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">{m.product?.name || '-'}</span>
                          <span className="text-xs text-gray-400 ml-2">#{m.product?.code}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          m.type === 'entrée' ? 'bg-emerald-50 text-emerald-700' :
                          m.type === 'sortie' ? 'bg-rose-50 text-rose-700' :
                          'bg-amber-50 text-amber-700'
                        }`}>
                          {m.type === 'entrée' ? <ArrowDownRight size={14} /> : m.type === 'sortie' ? <ArrowUpRight size={14} /> : <RefreshCw size={14} />}
                          {m.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-bold text-gray-700">{m.quantite}</td>
                      <td className="px-4 py-3 text-right text-sm text-gray-600">{m.prixUnitaire?.toFixed(2) || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Warehouse size={14} className="text-gray-400" />
                          {m.depot?.nom || '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{m.documentRef || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 max-w-[200px] truncate">{m.motif || '-'}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">Total: <span className="font-bold">{total}</span> mouvements</div>
            <div className="flex items-center gap-2">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="p-1 rounded hover:bg-slate-200 text-gray-500 disabled:opacity-30"><ChevronLeft size={18} /></button>
              <span className="text-sm text-gray-500">Page {page} / {Math.max(1, totalPages)}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1 rounded hover:bg-slate-200 text-gray-500 disabled:opacity-30"><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
