/**
 * Inventaire - Page Liste des Inventaires
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  Plus, Search, Filter, Printer, Download, Eye, Edit2, Trash2,
  CheckCircle2, XCircle, Clock, Calendar, Warehouse, Package,
  ArrowUpDown, ClipboardList, Barcode, Calculator, AlertCircle,
  TrendingUp, Boxes, ChevronLeft, ChevronRight, ScanBarcode
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ============================================
// TYPES
// ============================================
type InventoryStatus = 'draft' | 'in_progress' | 'validated' | 'adjusted' | 'cancelled';
type InventoryType = 'full' | 'partial' | 'cycle' | 'spot';

interface InventoryLine {
  id: string;
  lineNumber: number;
  code: string;
  designation: string;
  unit: string;
  theoreticalQty: number;
  actualQty: number;
  difference: number;
  unitCost: number;
  totalDifference: number;
  batchNumber?: string;
  location?: string;
  isAdjusted: boolean;
}

interface InventaireItem {
  id: string;
  number: string;
  date: string;
  depot: string;
  depotName: string;
  status: InventoryStatus;
  type: InventoryType;
  lines: InventoryLine[];
  totalTheoretical: number;
  totalActual: number;
  totalDifference: number;
  totalValueDifference: number;
  createdBy: string;
  validatedBy?: string;
  validatedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_MAP: Record<string, InventoryStatus> = {
  brouillon: 'draft',
  validé: 'validated',
  en_cours: 'in_progress',
  ajusté: 'adjusted',
  annulé: 'cancelled',
};

const mapInventaire = (inv: any): InventaireItem => ({
  id: inv.id,
  number: inv.reference,
  date: (inv.date || '').split('T')[0],
  depot: inv.depot?.id || '',
  depotName: inv.depot?.nom || '',
  status: STATUS_MAP[inv.statut] || 'draft',
  type: 'full',
  lines: (inv.items || []).map((item: any, idx: number) => ({
    id: item.id,
    lineNumber: idx + 1,
    code: item.product?.code || '',
    designation: item.product?.name || '',
    unit: item.product?.unit || '',
    theoreticalQty: item.stockTheorique || 0,
    actualQty: item.stockPhysique || 0,
    difference: item.ecart || 0,
    unitCost: item.product?.buyPrice || 0,
    totalDifference: (item.ecart || 0) * (item.product?.buyPrice || 0),
    isAdjusted: item.ecart !== 0,
  })),
  totalTheoretical: (inv.items || []).reduce((s: number, i: any) => s + (i.stockTheorique || 0), 0),
  totalActual: (inv.items || []).reduce((s: number, i: any) => s + (i.stockPhysique || 0), 0),
  totalDifference: (inv.items || []).reduce((s: number, i: any) => s + (i.ecart || 0), 0),
  totalValueDifference: (inv.items || []).reduce((s: number, i: any) => s + ((i.ecart || 0) * (i.product?.buyPrice || 0)), 0),
  createdBy: inv.user?.name || '',
  createdAt: inv.createdAt,
  updatedAt: inv.updatedAt,
});

// ============================================
// UTILITY COMPONENTS
// ============================================
const StatusBadge: React.FC<{ status: InventoryStatus }> = ({ status }) => {
  const configs: Record<InventoryStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600 border-gray-200', icon: <Clock size={14} /> },
    in_progress: { label: 'En cours', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <ScanBarcode size={14} /> },
    validated: { label: 'Validé', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle2 size={14} /> },
    adjusted: { label: 'Ajusté', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <Calculator size={14} /> },
    cancelled: { label: 'Annulé', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: <XCircle size={14} /> },
  };
  const config = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

const TypeBadge: React.FC<{ type: InventoryType }> = ({ type }) => {
  const configs: Record<InventoryType, { label: string; color: string }> = {
    full: { label: 'Complet', color: 'bg-indigo-50 text-indigo-600' },
    partial: { label: 'Partiel', color: 'bg-purple-50 text-purple-600' },
    cycle: { label: 'Rotatif', color: 'bg-cyan-50 text-cyan-600' },
    spot: { label: 'Spot', color: 'bg-orange-50 text-orange-600' },
  };
  const config = configs[type];
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
};

// ============================================
// STATS CARD COMPONENT
// ============================================
const StatCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color: 'blue' | 'emerald' | 'amber' | 'rose' | 'purple';
}> = ({ title, value, subtitle, icon, trend, color }) => {
  const colorClasses = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-200/50 text-blue-600',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-200/50 text-emerald-600',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-200/50 text-amber-600',
    rose: 'from-rose-500/10 to-rose-600/5 border-rose-200/50 text-rose-600',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-200/50 text-purple-600',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClasses[color]} border p-5`}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-1 text-2xl font-bold text-gray-800">{value}</p>
            {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className={`p-2.5 rounded-xl bg-white/60 backdrop-blur-sm`}>
            {icon}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export const Inventaire: React.FC = () => {
  const navigate = useNavigate();
  const [inventaires, setInventaires] = useState<InventaireItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InventoryStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<InventoryType | 'all'>('all');
  const [selectedInventaire, setSelectedInventaire] = useState<InventaireItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchInventaires = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/stock/inventaires');
      const data = res.data?.data || res.data || [];
      setInventaires(data.map(mapInventaire));
    } catch { setInventaires([]); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchInventaires(); }, []);

  // Filter logic
  const filteredInventaires = useMemo(() => {
    return inventaires.filter(inv => {
      const matchesSearch = 
        inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.depotName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchesType = typeFilter === 'all' || inv.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [inventaires, searchTerm, statusFilter, typeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredInventaires.length / itemsPerPage);
  const paginatedInventaires = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInventaires.slice(start, start + itemsPerPage);
  }, [filteredInventaires, currentPage]);

  // Stats
  const stats = useMemo(() => {
    const total = inventaires.length;
    const inProgress = inventaires.filter(i => i.status === 'in_progress').length;
    const validated = inventaires.filter(i => i.status === 'validated' || i.status === 'adjusted').length;
    const totalDiff = inventaires.reduce((sum, i) => sum + Math.abs(i.totalValueDifference), 0);
    return { total, inProgress, validated, totalDiff };
  }, [inventaires]);

  const handleViewDetail = useCallback((inventaire: InventaireItem) => {
    setSelectedInventaire(inventaire);
    setShowDetailModal(true);
  }, []);

  const handleEdit = useCallback((id: string) => {
    navigate(`/dashboard/stock/inventaire/${id}`);
  }, [navigate]);

  const handleNew = useCallback(() => {
    navigate('/dashboard/stock/inventaire/nouveau');
  }, [navigate]);

  return (
    <DashboardLayout title="Inventaire">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Inventaires"
            value={stats.total}
            subtitle="Tous types confondus"
            icon={<ClipboardList size={22} className="text-blue-600" />}
            color="blue"
          />
          <StatCard
            title="En cours"
            value={stats.inProgress}
            subtitle="Inventaires actifs"
            icon={<ScanBarcode size={22} className="text-amber-600" />}
            color="amber"
          />
          <StatCard
            title="Validés"
            value={stats.validated}
            subtitle="Terminés ce mois"
            icon={<CheckCircle2 size={22} className="text-emerald-600" />}
            color="emerald"
          />
          <StatCard
            title="Écarts Total"
            value={`${stats.totalDiff.toFixed(2)} DH`}
            subtitle="Valeur des différences"
            icon={<TrendingUp size={22} className="text-purple-600" />}
            color="purple"
          />
        </div>

        {/* Filters & Actions */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            {/* Search */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un inventaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-64 rounded-xl border border-gray-200 bg-white text-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InventoryStatus | 'all')}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 focus:border-emerald-500 outline-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="draft">Brouillon</option>
              <option value="in_progress">En cours</option>
              <option value="validated">Validé</option>
              <option value="adjusted">Ajusté</option>
              <option value="cancelled">Annulé</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as InventoryType | 'all')}
              className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 focus:border-emerald-500 outline-none"
            >
              <option value="all">Tous les types</option>
              <option value="full">Complet</option>
              <option value="partial">Partiel</option>
              <option value="cycle">Rotatif</option>
              <option value="spot">Spot</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
              <Download size={18} />
              <span className="hidden sm:inline text-sm">Exporter</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
              <Printer size={18} />
              <span className="hidden sm:inline text-sm">Imprimer</span>
            </button>
            <button
              onClick={handleNew}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5"
            >
              <Plus size={18} />
              <span className="text-sm">Nouvel Inventaire</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                    <div className="flex items-center gap-1">N° Inventaire <ArrowUpDown size={14} /></div>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Dépôt</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Écart Qté</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">Écart Valeur</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={8} className="py-20 text-center"><div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto" /></td></tr>
                ) : paginatedInventaires.length === 0 ? (
                  <tr><td colSpan={8} className="py-20 text-center text-gray-400">Aucun inventaire trouvé</td></tr>
                ) : paginatedInventaires.map((inv) => (
                  <motion.tr
                    key={inv.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-indigo-50">
                          <ClipboardList size={16} className="text-indigo-600" />
                        </div>
                        <span className="font-medium text-gray-700">{inv.number}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(inv.date).toLocaleDateString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Warehouse size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-700">{inv.depotName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={inv.type} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={inv.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${inv.totalDifference === 0 ? 'text-emerald-600' : inv.totalDifference > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {inv.totalDifference > 0 ? '+' : ''}{inv.totalDifference}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-medium ${inv.totalValueDifference === 0 ? 'text-emerald-600' : inv.totalValueDifference > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                        {inv.totalValueDifference > 0 ? '+' : ''}{inv.totalValueDifference.toFixed(2)} DH
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewDetail(inv)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-emerald-600 transition-colors"
                          title="Voir détail"
                        >
                          <Eye size={16} />
                        </button>
                        {inv.status !== 'validated' && inv.status !== 'cancelled' && (
                          <button
                            onClick={() => handleEdit(inv.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Modifier"
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Affichage {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredInventaires.length)} sur {filteredInventaires.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {showDetailModal && selectedInventaire && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowDetailModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl  w-full max-h-[90vh] overflow-hidden"
              >
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-100">
                      <ClipboardList size={20} className="text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-800">{selectedInventaire.number}</h3>
                      <p className="text-sm text-gray-500">Créé par {selectedInventaire.createdBy} le {new Date(selectedInventaire.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={selectedInventaire.status} />
                    <button
                      onClick={() => setShowDetailModal(false)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 rounded-xl bg-gray-50">
                      <p className="text-xs text-gray-500 mb-1">Dépôt</p>
                      <p className="font-medium text-gray-700 flex items-center gap-1.5">
                        <Warehouse size={14} className="text-gray-400" />
                        {selectedInventaire.depotName}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50">
                      <p className="text-xs text-gray-500 mb-1">Type</p>
                      <TypeBadge type={selectedInventaire.type} />
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50">
                      <p className="text-xs text-gray-500 mb-1">Qté Théorique</p>
                      <p className="font-medium text-gray-700">{selectedInventaire.totalTheoretical}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-gray-50">
                      <p className="text-xs text-gray-500 mb-1">Qté Réelle</p>
                      <p className="font-medium text-gray-700">{selectedInventaire.totalActual}</p>
                    </div>
                  </div>

                  {/* Lines Table */}
                  {selectedInventaire.lines.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Barcode size={16} />
                        Lignes d'inventaire ({selectedInventaire.lines.length})
                      </h4>
                      <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Code</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Désignation</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Théorique</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Réel</th>
                              <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Écart</th>
                              <th className="px-3 py-2 text-center text-xs font-medium text-gray-600">Ajusté</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {selectedInventaire.lines.map((line) => (
                              <tr key={line.id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 font-medium text-gray-700">{line.code}</td>
                                <td className="px-3 py-2 text-gray-600">{line.designation}</td>
                                <td className="px-3 py-2 text-right text-gray-600">{line.theoreticalQty}</td>
                                <td className="px-3 py-2 text-right font-medium text-gray-700">{line.actualQty}</td>
                                <td className={`px-3 py-2 text-right font-medium ${line.difference === 0 ? 'text-emerald-600' : line.difference > 0 ? 'text-amber-600' : 'text-rose-600'}`}>
                                  {line.difference > 0 ? '+' : ''}{line.difference}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {line.isAdjusted ? (
                                    <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                                  ) : (
                                    <span className="text-gray-300">-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedInventaire.notes && (
                    <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-100">
                      <p className="text-xs text-amber-600 font-medium mb-1 flex items-center gap-1.5">
                        <AlertCircle size={14} />
                        Notes
                      </p>
                      <p className="text-sm text-amber-700">{selectedInventaire.notes}</p>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-2">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Fermer
                  </button>
                  {selectedInventaire.status !== 'validated' && selectedInventaire.status !== 'cancelled' && (
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        handleEdit(selectedInventaire.id);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
                    >
                      Modifier
                    </button>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default Inventaire;
