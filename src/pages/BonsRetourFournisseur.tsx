/**
 * Bons de Retour Fournisseur - Modern 2026 Professional ERP Design
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  Plus, Search, Filter, Printer, Download, FileText, Edit2, Trash2, Eye,
  CheckCircle2, XCircle, Clock, Send, ChevronLeft, ChevronRight,
  RotateCcw, AlertTriangle, Package, ArrowUpLeft, Tag, Building2,
  Calendar, CheckSquare, Truck, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ============================================
// TYPES
// ============================================
type ReturnStatus = 'draft' | 'prepared' | 'sent' | 'received' | 'credited' | 'cancelled';
type ReturnReason = 'damaged' | 'expired' | 'wrong' | 'excess' | 'quality' | 'other';

interface ReturnItem {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
  batchNumber?: string;
  expiryDate?: string;
  condition: 'good' | 'damaged' | 'expired';
  reason: ReturnReason;
}

interface BonRetourFournisseur {
  id: string;
  number: string;
  date: string;
  expectedReturnDate: string;
  actualReturnDate?: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierCity?: string;
  status: ReturnStatus;
  reason: ReturnReason;
  reasonDetails?: string;
  items: ReturnItem[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  creditNoteNumber?: string;
  creditNoteAmount?: number;
  transportCost?: number;
  observation?: string;
  commercial: string;
  createdAt: string;
  updatedAt: string;
}

const REASON_LABELS: Record<ReturnReason, { label: string; color: string; icon: React.ReactNode }> = {
  damaged: { label: 'Endommagé', color: 'bg-rose-100 text-rose-700', icon: <AlertTriangle size={14} /> },
  expired: { label: 'Périmé', color: 'bg-orange-100 text-orange-700', icon: <Clock size={14} /> },
  wrong: { label: 'Erreur Livraison', color: 'bg-blue-100 text-blue-700', icon: <RotateCcw size={14} /> },
  excess: { label: 'Excès', color: 'bg-purple-100 text-purple-700', icon: <Package size={14} /> },
  quality: { label: 'Qualité', color: 'bg-amber-100 text-amber-700', icon: <AlertTriangle size={14} /> },
  other: { label: 'Autre', color: 'bg-gray-100 text-gray-600', icon: <Tag size={14} /> },
};

// ============================================
// UTILITY COMPONENTS
// ============================================
const StatusBadge: React.FC<{ status: ReturnStatus }> = ({ status }) => {
  const configs: Record<ReturnStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <Clock size={14} /> },
    prepared: { label: 'Préparé', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <Package size={14} /> },
    sent: { label: 'Envoyé', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <Truck size={14} /> },
    received: { label: 'Reçu', color: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: <CheckSquare size={14} /> },
    credited: { label: 'Crédité', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle2 size={14} /> },
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

const ReasonBadge: React.FC<{ reason: ReturnReason }> = ({ reason }) => {
  const config = REASON_LABELS[reason];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export const BonsRetourFournisseur: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | 'all'>('all');
  const [reasonFilter, setReasonFilter] = useState<ReturnReason | 'all'>('all');
  const [selectedReturn, setSelectedReturn] = useState<BonRetourFournisseur | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [returns, setReturns] = useState<BonRetourFournisseur[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/achat/retours', { params: { limit: 200 } });
        const data = res.data?.data || res.data || [];
        setReturns(data.map((r: any) => ({
          id: r.id,
          number: r.reference || '',
          date: r.date ? new Date(r.date).toLocaleDateString('fr-FR') : '',
          expectedReturnDate: '',
          supplierId: r.fournisseur?.id || '',
          supplierCode: r.fournisseur?.code || '',
          supplierName: r.fournisseur?.name || r.fournisseur?.raisonSociale || '',
          supplierCity: r.fournisseur?.ville || '',
          supplierPhone: r.fournisseur?.telephone || '',
          status: r.statut === 'en_attente' ? 'sent' : r.statut === 'retourné' ? 'received' : r.statut === 'annulé' ? 'cancelled' : 'draft',
          reason: 'other',
          reasonDetails: r.motif || '',
          items: [],
          totalHT: r.totalHT || 0,
          totalTVA: 0,
          totalTTC: r.totalTTC || 0,
          creditNoteNumber: r.avoirId || undefined,
          creditNoteAmount: 0,
          transportCost: 0,
          observation: r.motif || '',
          commercial: '',
          createdAt: r.date || '',
          updatedAt: '',
        } as BonRetourFournisseur)));
      } catch (err) {
        console.error('Erreur chargement retours fournisseur:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredReturns = useMemo(() => {
    return returns.filter(ret => {
      const matchesSearch = 
        ret.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ret.supplierName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
      const matchesReason = reasonFilter === 'all' || ret.reason === reasonFilter;
      return matchesSearch && matchesStatus && matchesReason;
    });
  }, [searchQuery, statusFilter, reasonFilter]);

  const paginatedReturns = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredReturns.slice(start, start + itemsPerPage);
  }, [filteredReturns, currentPage]);

  const totalPages = Math.ceil(filteredReturns.length / itemsPerPage);

  const handleViewDetail = useCallback((ret: BonRetourFournisseur) => {
    setSelectedReturn(ret);
    setShowDetailModal(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    navigate('/dashboard/achat/retours/nouveau');
  }, [navigate]);

  const stats = useMemo(() => ({
    total: returns.length,
    totalAmount: returns.reduce((sum, ret) => sum + ret.totalTTC, 0),
    credited: returns.filter(ret => ret.status === 'credited').length,
    pending: returns.filter(ret => ret.status === 'draft' || ret.status === 'prepared' || ret.status === 'sent').length,
  }), []);

  return (
    <DashboardLayout title="Bons de Retour Fournisseur">
      <div className="h-full flex flex-col gap-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl p-4 text-white shadow-lg shadow-rose-500/25">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-rose-100 text-sm">Total Retours</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <RotateCcw size={24} className="text-rose-200" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white shadow-lg shadow-orange-500/25">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Montant Total</p>
                <p className="text-2xl font-bold">{stats.totalAmount.toLocaleString('fr-FR')} DH</p>
              </div>
              <Package size={24} className="text-orange-200" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-500/25">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Crédités</p>
                <p className="text-2xl font-bold">{stats.credited}</p>
              </div>
              <CheckCircle2 size={24} className="text-emerald-200" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg shadow-amber-500/25">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">En Cours</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Truck size={24} className="text-amber-200" />
            </div>
          </motion.div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher par N° retour, fournisseur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 w-full"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ReturnStatus | 'all')}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="prepared">Préparé</option>
                <option value="sent">Envoyé</option>
                <option value="received">Reçu</option>
                <option value="credited">Crédité</option>
                <option value="cancelled">Annulé</option>
              </select>
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value as ReturnReason | 'all')}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="all">Tous les motifs</option>
                <option value="damaged">Endommagé</option>
                <option value="expired">Périmé</option>
                <option value="wrong">Erreur Livraison</option>
                <option value="excess">Excès</option>
                <option value="quality">Qualité</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                <Download size={16} />
                Exporter
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-rose-500/25"
              >
                <Plus size={18} />
                Nouveau Retour
              </motion.button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">N° Retour</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fournisseur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Motif</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Montant TTC</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Avoir</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
  <tr><td colSpan={8} className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-rose-500" /></td></tr>
) : paginatedReturns.length === 0 ? (
  <tr><td colSpan={8} className="text-center py-12 text-gray-400">Aucun résultat trouvé</td></tr>
) : paginatedReturns.map((ret) => (
                  <motion.tr
                    key={ret.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-700">{ret.number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs">
                          {ret.supplierName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">{ret.supplierName}</p>
                          <p className="text-xs text-gray-400">{ret.supplierCity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-600">{ret.date}</span>
                        <span className="text-xs text-gray-400">Retour prévu: {ret.expectedReturnDate}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ReasonBadge reason={ret.reason} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-gray-700">{ret.totalTTC.toLocaleString('fr-FR')} DH</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ret.creditNoteNumber ? (
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-medium text-emerald-600">{ret.creditNoteNumber}</span>
                          <span className="text-xs text-gray-400">{ret.creditNoteAmount?.toLocaleString('fr-FR')} DH</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={ret.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewDetail(ret)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Voir détails"
                        >
                          <Eye size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Modifier">
                          <Edit2 size={18} />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-all" title="Imprimer">
                          <Printer size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-400">
              Affichage de {paginatedReturns.length} sur {filteredReturns.length} retours
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-500">
                Page {currentPage} / {totalPages || 1}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {showDetailModal && selectedReturn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowDetailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl shadow-2xl  w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-rose-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <RotateCcw size={24} className="text-rose-600" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-700">{selectedReturn.number}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={selectedReturn.status} />
                      <ReasonBadge reason={selectedReturn.reason} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 text-slate-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
                      <Building2 size={16} className="text-rose-600" />
                      Fournisseur
                    </h4>
                    <p className="font-medium text-gray-700">{selectedReturn.supplierName}</p>
                    <p className="text-sm text-gray-400">{selectedReturn.supplierAddress}</p>
                    <p className="text-sm text-gray-400">{selectedReturn.supplierCity}</p>
                    <p className="text-sm text-gray-400 mt-2">{selectedReturn.supplierPhone}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
                      <Calendar size={16} className="text-rose-600" />
                      Dates
                    </h4>
                    <div className="space-y-1">
                      <p className="text-sm"><span className="text-gray-400">Date création:</span> <span className="font-medium">{selectedReturn.date}</span></p>
                      <p className="text-sm"><span className="text-gray-400">Retour prévu:</span> <span className="font-medium">{selectedReturn.expectedReturnDate}</span></p>
                      {selectedReturn.actualReturnDate && (
                        <p className="text-sm"><span className="text-gray-400">Retour effectif:</span> <span className="font-medium text-emerald-600">{selectedReturn.actualReturnDate}</span></p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reason Details */}
                {selectedReturn.reasonDetails && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-amber-700 mb-2 flex items-center gap-2">
                      <AlertTriangle size={16} />
                      Motif du retour
                    </h4>
                    <p className="text-amber-800">{selectedReturn.reasonDetails}</p>
                  </div>
                )}

                {/* Items Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 mb-6">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Produit</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-400">Qté</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Prix HT</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Total HT</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-400">Lot</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-400">État</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedReturn.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2">
                            <p className="font-medium text-sm text-gray-700">{item.productName}</p>
                            <p className="text-xs text-gray-400">{item.productCode}</p>
                          </td>
                          <td className="px-4 py-2 text-center text-sm text-gray-600">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-600">{item.unitPrice.toFixed(2)} DH</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-600">{item.total.toFixed(2)} DH</td>
                          <td className="px-4 py-2 text-center text-xs text-gray-400">{item.batchNumber || '-'}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                              item.condition === 'good' ? 'bg-emerald-100 text-emerald-700' : 
                              item.condition === 'damaged' ? 'bg-rose-100 text-rose-700' : 
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {item.condition === 'good' ? 'Bon' : item.condition === 'damaged' ? 'Endommagé' : 'Périmé'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total HT</span>
                    <span className="font-medium">{selectedReturn.totalHT.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">TVA</span>
                    <span className="font-medium">{selectedReturn.totalTVA.toFixed(2)} DH</span>
                  </div>
                  {selectedReturn.transportCost && selectedReturn.transportCost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Transport</span>
                      <span className="font-medium">{selectedReturn.transportCost.toFixed(2)} DH</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span className="text-gray-700">Total TTC</span>
                    <span className="text-rose-600">{selectedReturn.totalTTC.toFixed(2)} DH</span>
                  </div>
                </div>

                {/* Credit Note Info */}
                {selectedReturn.creditNoteNumber && (
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <h4 className="font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Avoir reçu
                    </h4>
                    <div className="flex justify-between items-center">
                      <span className="text-emerald-800">{selectedReturn.creditNoteNumber}</span>
                      <span className="font-bold text-emerald-700">{selectedReturn.creditNoteAmount?.toFixed(2)} DH</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Commercial: <span className="font-medium text-gray-600">{selectedReturn.commercial}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-white">
                    <Printer size={16} />
                    Imprimer
                  </button>
                  {selectedReturn.status === 'credited' && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-sm font-medium">
                      <CheckCircle2 size={16} />
                      Traité
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};
