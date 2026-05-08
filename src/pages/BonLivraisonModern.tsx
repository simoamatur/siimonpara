import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  Plus, Search, FileText, Edit2, Trash2, Eye,
  CheckCircle2, XCircle, Clock, Package, Calendar, Truck,
  ChevronLeft, ChevronRight, ArrowUpDown, Download, AlertCircle,
  Copy, Phone, MapPin, User, Calculator
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useConfirm } from '../contexts/ConfirmContext';

interface BonLivraisonItem {
  id: string;
  productId: string;
  productCode?: string;
  productName?: string;
  quantity: number;
  unit?: string;
  priceHT: number;
  discount: number;
  tva: number;
  totalHT: number;
  totalTTC: number;
}

interface BonLivraison {
  id: string;
  reference: string;
  date: string;
  clientId: string;
  client?: { id: string; code: string; name: string; city?: string; phone?: string };
  user?: { id: string; name: string };
  items?: BonLivraisonItem[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  discount: number;
  validated: boolean;
  printedCount: number;
  paymentMode: string;
  createdAt: string;
}

export const BonLivraisonModern: React.FC = () => {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const handleDownloadPdf = (id: string) => window.open(`/api/pdf/bon-livraison/${id}`, '_blank');
  const [bons, setBons] = useState<BonLivraison[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedBon, setSelectedBon] = useState<BonLivraison | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'reference' | 'total'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchBons = async () => {
    try { const res = await axios.get('/api/bon-livraison'); setBons(res.data.data || res.data); }
    catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBons(); }, []);

  const stats = useMemo(() => ({
    total: bons.length,
    today: bons.filter(b => b.date?.startsWith(new Date().toISOString().split('T')[0])).length,
    draft: bons.filter(b => !b.validated).length,
    pendingDelivery: bons.filter(b => b.validated && b.printedCount > 0).length,
    totalAmount: bons.reduce((acc, b) => acc + b.totalTTC, 0),
  }), [bons]);

  const filteredBons = useMemo(() => {
    let result = [...bons];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b =>
        b.reference.toLowerCase().includes(q) ||
        (b.client?.name || '').toLowerCase().includes(q) ||
        (b.client?.code || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(b => {
        if (statusFilter === 'draft') return !b.validated;
        if (statusFilter === 'validated') return b.validated && b.printedCount === 0;
        if (statusFilter === 'printed') return b.printedCount > 0;
        return true;
      });
    }
    const today = new Date();
    if (dateRange === 'today') result = result.filter(b => b.date?.startsWith(today.toISOString().split('T')[0]));
    else if (dateRange === 'week') { const w = new Date(today.setDate(today.getDate() - 7)); result = result.filter(b => new Date(b.date) >= w); }
    else if (dateRange === 'month') { const m = new Date(today.setDate(today.getDate() - 30)); result = result.filter(b => new Date(b.date) >= m); }
    result.sort((a, b) => {
      let c = 0;
      if (sortBy === 'date') c = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortBy === 'reference') c = a.reference.localeCompare(b.reference);
      else if (sortBy === 'total') c = a.totalTTC - b.totalTTC;
      return sortOrder === 'asc' ? c : -c;
    });
    return result;
  }, [bons, searchQuery, statusFilter, dateRange, sortBy, sortOrder]);

  const handleCreate = () => navigate('/dashboard/vente/bon-livraison/nouveau');
  const handleView = (bon: BonLivraison) => { setSelectedBon(bon); setViewMode('detail'); };
  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: 'Supprimer ce bon de livraison ?'}))) return;
    try { await axios.delete(`/api/bon-livraison/${id}`); await fetchBons(); }
    catch { /* ignore */ }
  };
  const handleValidate = async (id: string) => {
    try { await axios.put(`/api/bon-livraison/${id}`, { validated: true }); await fetchBons(); }
    catch { /* ignore */ }
  };

  const renderList = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total BL', value: stats.total, icon: FileText, color: 'from-blue-500 to-cyan-500' },
          { label: "Aujourd'hui", value: stats.today, icon: Calendar, color: 'from-emerald-500 to-teal-500' },
          { label: 'Brouillons', value: stats.draft, icon: Clock, color: 'from-slate-500 to-gray-500' },
          { label: 'À Livrer', value: stats.pendingDelivery, icon: Truck, color: 'from-amber-500 to-orange-500' },
          { label: 'Chiffre', value: `${stats.totalAmount.toLocaleString('fr-FR')} DH`, icon: Calculator, color: 'from-violet-500 to-purple-500' },
          { label: 'Impayé', value: `${bons.filter(b => !b.validated).reduce((a, b) => a + b.totalTTC, 0).toLocaleString('fr-FR')} DH`, icon: AlertCircle, color: 'from-rose-500 to-pink-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-xl bg-white border border-gray-200 p-4">
            <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${stat.color} opacity-10 rounded-bl-full`} />
            <div className="flex items-start justify-between">
              <div><p className="text-xs text-gray-400 font-medium">{stat.label}</p><p className="text-lg font-bold text-gray-700 mt-1">{stat.value}</p></div>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white`}><stat.icon size={16} /></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input type="text" placeholder="Rechercher BL, client..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-64 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="validated">Validé</option>
            <option value="printed">Imprimé</option>
          </select>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
            <option value="all">Toutes dates</option>
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
          </select>
        </div>
        <button onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg font-medium shadow-lg shadow-emerald-500/25">
          <Plus size={18} /> Nouveau BL
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          {loading ? <div className="flex justify-center py-8"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" /></div> : (
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-3 py-3 text-left"><button onClick={() => { setSortBy('reference'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase">Référence <ArrowUpDown size={12} /></button></th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Date</th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Client</th>
                <th className="px-3 py-3 text-right"><button onClick={() => { setSortBy('total'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }} className="flex items-center gap-1 text-xs font-semibold text-gray-400 uppercase ml-auto">Total TTC <ArrowUpDown size={12} /></button></th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Statut</th>
                <th className="px-3 py-3 text-center text-xs font-semibold text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBons.map((bon, index) => (
                <motion.tr key={bon.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}
                  className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => handleView(bon)}>
                  <td className="px-3 py-3"><span className="font-mono text-sm font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded">{bon.reference}</span></td>
                  <td className="px-3 py-3"><span className="text-sm text-gray-600">{new Date(bon.date).toLocaleDateString('fr-FR')}</span></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">{bon.client?.name?.charAt(0) || '?'}</div>
                      <div><p className="text-sm font-medium text-gray-700">{bon.client?.name || '-'}</p><p className="text-xs text-gray-400">{bon.client?.code}</p></div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right"><span className="text-sm font-bold text-gray-700">{bon.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</span></td>
                  <td className="px-3 py-3 text-center">
                    {bon.validated
                      ? <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-blue-50 text-blue-600 border-blue-200"><CheckCircle2 size={14} />Validé</span>
                      : <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-gray-100 text-gray-500 border-gray-200"><Clock size={14} />Brouillon</span>
                    }
                  </td>
                  <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => handleView(bon)} className="p-1.5 rounded hover:bg-gray-100 text-slate-400 hover:text-emerald-600"><Eye size={16} /></button>
                      <button onClick={() => handleDownloadPdf(bon.id)} className="p-1.5 rounded hover:bg-violet-50 text-slate-400 hover:text-violet-600"><Download size={16} /></button>
                      {!bon.validated && <button onClick={() => handleValidate(bon.id)} className="p-1.5 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-600"><CheckCircle2 size={16} /></button>}
                      {!bon.validated && <button onClick={() => handleDelete(bon.id)} className="p-1.5 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
        {filteredBons.length === 0 && !loading && (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gray-100 flex items-center justify-center"><FileText size={32} className="text-slate-400" /></div>
            <p className="text-gray-400 font-medium">Aucun bon de livraison trouvé</p>
          </div>
        )}
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-400">Affichage de <span className="font-semibold text-gray-600">{filteredBons.length}</span> sur {bons.length} BL</p>
        </div>
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedBon) return null;
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setViewMode('list')} className="p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-emerald-600 transition-all"><ChevronLeft size={20} /></button>
          <div className="flex-1"><h2 className="text-xl font-bold text-gray-700">{selectedBon.reference}</h2><p className="text-sm text-gray-400">{selectedBon.client?.name} • {new Date(selectedBon.date).toLocaleDateString('fr-FR')}</p></div>
          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold border ${selectedBon.validated ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
            {selectedBon.validated ? <CheckCircle2 size={16} /> : <Clock size={16} />}
            {selectedBon.validated ? 'Validé' : 'Brouillon'}
          </span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider mb-4">Informations Client</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center"><User size={20} className="text-emerald-600" /></div>
                  <div><p className="text-sm font-medium text-gray-700">{selectedBon.client?.name}</p><p className="text-xs text-gray-400">{selectedBon.client?.code}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"><MapPin size={20} className="text-blue-600" /></div>
                  <div><p className="text-sm font-medium text-gray-700">{selectedBon.client?.city || '-'}</p></div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center"><Phone size={20} className="text-amber-600" /></div>
                  <div><p className="text-sm font-medium text-gray-700">{selectedBon.client?.phone || '-'}</p></div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 text-white">
              <p className="text-sm font-medium text-emerald-100 mb-1">Total TTC</p>
              <p className="text-3xl font-bold">{selectedBon.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH</p>
              <div className="mt-4 pt-4 border-t border-white/20 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-emerald-100">Total HT</span><span>{selectedBon.totalHT.toFixed(2)} DH</span></div>
                <div className="flex justify-between text-sm"><span className="text-emerald-100">TVA</span><span>{selectedBon.totalTVA.toFixed(2)} DH</span></div>
                <div className="flex justify-between text-sm"><span className="text-emerald-100">Remise</span><span>{selectedBon.discount.toFixed(2)} DH</span></div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h4 className="text-sm font-semibold text-gray-600 mb-4">Paiement</h4>
              <div className="space-y-3">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Mode</span><span className="font-medium text-gray-700">{selectedBon.paymentMode}</span></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <DashboardLayout title="Bons de Livraison">
      <AnimatePresence mode="wait">
        {viewMode === 'list' && renderList()}
        {viewMode === 'detail' && renderDetail()}
      </AnimatePresence>
    </DashboardLayout>
  );
};
