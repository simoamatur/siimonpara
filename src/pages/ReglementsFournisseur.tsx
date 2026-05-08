/**
 * Règlements Fournisseur - Modern 2026 Professional ERP Design
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  Plus, Search, Filter, Printer, Download, FileText, Edit2, Trash2, Eye,
  CheckCircle2, XCircle, Clock, Send, ChevronLeft, ChevronRight,
  CreditCard, DollarSign, Building2, Calendar, CheckSquare, Banknote,
  ArrowRightLeft, FileCheck, Landmark, Wallet, Receipt, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ============================================
// TYPES
// ============================================
type PaymentStatus = 'draft' | 'pending' | 'paid' | 'cancelled';
type PaymentMode = 'cash' | 'check' | 'transfer' | 'card' | 'direct_debit';

interface PaymentLine {
  id: string;
  invoiceRef: string;
  invoiceDate: string;
  originalAmount: number;
  remainingAmount: number;
  amountToPay: number;
  discountAmount: number;
  finalAmount: number;
}

interface ReglementFournisseur {
  id: string;
  number: string;
  date: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierCity?: string;
  status: PaymentStatus;
  paymentMode: PaymentMode;
  bankReference?: string;
  checkNumber?: string;
  totalAmount: number;
  discountTotal: number;
  netAmount: number;
  appliedAvoirAmount?: number;
  appliedAvoirRef?: string;
  lines: PaymentLine[];
  observation?: string;
  commercial: string;
  createdAt: string;
  updatedAt: string;
}

const MODE_LABELS: Record<PaymentMode, { label: string; color: string; icon: React.ReactNode }> = {
  cash: { label: 'Espèces', color: 'bg-emerald-100 text-emerald-700', icon: <Banknote size={14} /> },
  check: { label: 'Chèque', color: 'bg-amber-100 text-amber-700', icon: <FileCheck size={14} /> },
  transfer: { label: 'Virement', color: 'bg-blue-100 text-blue-700', icon: <ArrowRightLeft size={14} /> },
  card: { label: 'Carte', color: 'bg-purple-100 text-purple-700', icon: <CreditCard size={14} /> },
  direct_debit: { label: 'Prélèvement', color: 'bg-cyan-100 text-cyan-700', icon: <Landmark size={14} /> },
};

// ============================================
// UTILITY COMPONENTS
// ============================================
const StatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const configs: Record<PaymentStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <Clock size={14} /> },
    pending: { label: 'En Attente', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <Clock size={14} /> },
    paid: { label: 'Payé', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle2 size={14} /> },
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

const ModeBadge: React.FC<{ mode: PaymentMode }> = ({ mode }) => {
  const config = MODE_LABELS[mode];
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
export const ReglementsFournisseur: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [modeFilter, setModeFilter] = useState<PaymentMode | 'all'>('all');
  const [selectedPayment, setSelectedPayment] = useState<ReglementFournisseur | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [payments, setPayments] = useState<ReglementFournisseur[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/achat/reglements', { params: { limit: 200 } });
        const data = res.data?.data || res.data || [];
        setPayments(data.map((p: any) => ({
          id: p.id,
          number: p.reference || '',
          date: p.date ? new Date(p.date).toLocaleDateString('fr-FR') : '',
          supplierId: p.fournisseur?.id || '',
          supplierCode: p.fournisseur?.code || '',
          supplierName: p.fournisseur?.name || p.fournisseur?.raisonSociale || '',
          supplierCity: p.fournisseur?.ville || '',
          status: 'paid',
          paymentMode: 'cash',
          totalAmount: p.montant || 0,
          discountTotal: 0,
          netAmount: p.montant || 0,
          lines: [],
          commercial: '',
          createdAt: p.date || '',
          updatedAt: '',
        } as ReglementFournisseur)));
      } catch (err) {
        console.error('Erreur chargement règlements fournisseur:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPayments = useMemo(() => {
    return payments.filter(pay => {
      const matchesSearch = 
        pay.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pay.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pay.bankReference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pay.checkNumber?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || pay.status === statusFilter;
      const matchesMode = modeFilter === 'all' || pay.paymentMode === modeFilter;
      return matchesSearch && matchesStatus && matchesMode;
    });
  }, [searchQuery, statusFilter, modeFilter]);

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);

  const handleViewDetail = useCallback((pay: ReglementFournisseur) => {
    setSelectedPayment(pay);
    setShowDetailModal(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    navigate('/dashboard/achat/reglements/nouveau');
  }, [navigate]);

  const stats = useMemo(() => ({
    total: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + p.netAmount, 0),
    paid: payments.filter(p => p.status === 'paid').length,
    pending: payments.filter(p => p.status === 'draft' || p.status === 'pending').length,
  }), []);

  return (
    <DashboardLayout title="Règlements Fournisseur">
      <div className="h-full flex flex-col gap-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-4 text-white shadow-lg shadow-cyan-500/25">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cyan-100 text-sm">Total Règlements</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <CreditCard size={24} className="text-cyan-200" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-500/25">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Montant Total</p>
                <p className="text-2xl font-bold">{stats.totalAmount.toLocaleString('fr-FR')} DH</p>
              </div>
              <DollarSign size={24} className="text-emerald-200" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg shadow-blue-500/25">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Payés</p>
                <p className="text-2xl font-bold">{stats.paid}</p>
              </div>
              <CheckCircle2 size={24} className="text-blue-200" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg shadow-amber-500/25">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">En Attente</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock size={24} className="text-amber-200" />
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
                  placeholder="Rechercher par N° règlement, fournisseur, référence..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 w-full"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="pending">En Attente</option>
                <option value="paid">Payé</option>
                <option value="cancelled">Annulé</option>
              </select>
              <select
                value={modeFilter}
                onChange={(e) => setModeFilter(e.target.value as PaymentMode | 'all')}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="all">Tous les modes</option>
                <option value="cash">Espèces</option>
                <option value="check">Chèque</option>
                <option value="transfer">Virement</option>
                <option value="card">Carte Bancaire</option>
                <option value="direct_debit">Prélèvement</option>
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
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-cyan-500/25"
              >
                <Plus size={18} />
                Nouveau Règlement
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">N° Règlement</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fournisseur</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Mode</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Montant</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
  <tr><td colSpan={7} className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-cyan-500" /></td></tr>
) : paginatedPayments.length === 0 ? (
  <tr><td colSpan={7} className="text-center py-12 text-gray-400">Aucun résultat trouvé</td></tr>
) : paginatedPayments.map((pay) => (
                  <motion.tr
                    key={pay.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-700">{pay.number}</span>
                        {pay.bankReference && (
                          <span className="text-xs text-gray-400">Ref: {pay.bankReference}</span>
                        )}
                        {pay.checkNumber && (
                          <span className="text-xs text-gray-400">Chèque: {pay.checkNumber}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-xs">
                          {pay.supplierName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">{pay.supplierName}</p>
                          <p className="text-xs text-gray-400">{pay.supplierCity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-600">{pay.date}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ModeBadge mode={pay.paymentMode} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-gray-700">{pay.netAmount.toLocaleString('fr-FR')} DH</span>
                        {pay.discountTotal > 0 && (
                          <span className="text-xs text-emerald-600">-Remise: {pay.discountTotal.toFixed(2)} DH</span>
                        )}
                        {pay.appliedAvoirAmount && pay.appliedAvoirAmount > 0 && (
                          <span className="text-xs text-violet-600">-Avoir: {pay.appliedAvoirAmount.toFixed(2)} DH</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={pay.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewDetail(pay)}
                          className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all"
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
              Affichage de {paginatedPayments.length} sur {filteredPayments.length} règlements
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
        {showDetailModal && selectedPayment && (
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
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard size={24} className="text-cyan-600" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-700">{selectedPayment.number}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={selectedPayment.status} />
                      <ModeBadge mode={selectedPayment.paymentMode} />
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
                      <Building2 size={16} className="text-cyan-600" />
                      Fournisseur
                    </h4>
                    <p className="font-medium text-gray-700">{selectedPayment.supplierName}</p>
                    <p className="text-sm text-gray-400">{selectedPayment.supplierAddress}</p>
                    <p className="text-sm text-gray-400">{selectedPayment.supplierCity}</p>
                    <p className="text-sm text-gray-400 mt-2">{selectedPayment.supplierPhone}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
                      <Calendar size={16} className="text-cyan-600" />
                      Informations Paiement
                    </h4>
                    <div className="space-y-1">
                      <p className="text-sm"><span className="text-gray-400">Date:</span> <span className="font-medium">{selectedPayment.date}</span></p>
                      <p className="text-sm"><span className="text-gray-400">Mode:</span> <span className="font-medium">{MODE_LABELS[selectedPayment.paymentMode].label}</span></p>
                      {selectedPayment.bankReference && (
                        <p className="text-sm"><span className="text-gray-400">Référence:</span> <span className="font-medium text-cyan-600">{selectedPayment.bankReference}</span></p>
                      )}
                      {selectedPayment.checkNumber && (
                        <p className="text-sm"><span className="text-gray-400">N° Chèque:</span> <span className="font-medium text-cyan-600">{selectedPayment.checkNumber}</span></p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Observation */}
                {selectedPayment.observation && (
                  <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-cyan-700 mb-2">Observation</h4>
                    <p className="text-cyan-800">{selectedPayment.observation}</p>
                  </div>
                )}

                {/* Applied Avoir */}
                {selectedPayment.appliedAvoirAmount && selectedPayment.appliedAvoirAmount > 0 && (
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-violet-700 mb-2 flex items-center gap-2">
                      <Receipt size={16} />
                      Avoir utilisé
                    </h4>
                    <div className="flex justify-between items-center">
                      <span className="text-violet-800">{selectedPayment.appliedAvoirRef}</span>
                      <span className="font-bold text-violet-700">-{selectedPayment.appliedAvoirAmount.toFixed(2)} DH</span>
                    </div>
                  </div>
                )}

                {/* Lines Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200 mb-6">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Facture</th>
                        <th className="px-4 py-2 text-center text-xs font-semibold text-gray-400">Date Fact.</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Montant Orig.</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Remise</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Payé</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPayment.lines.map((line) => (
                        <tr key={line.id}>
                          <td className="px-4 py-2">
                            <span className="font-medium text-sm text-gray-700">{line.invoiceRef}</span>
                          </td>
                          <td className="px-4 py-2 text-center text-sm text-gray-600">{line.invoiceDate}</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-600">{line.originalAmount.toFixed(2)} DH</td>
                          <td className="px-4 py-2 text-right text-sm text-emerald-600">{line.discountAmount > 0 ? `-${line.discountAmount.toFixed(2)} DH` : '-'}</td>
                          <td className="px-4 py-2 text-right text-sm font-semibold text-gray-700">{line.finalAmount.toFixed(2)} DH</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Montant Total</span>
                    <span className="font-medium">{selectedPayment.totalAmount.toFixed(2)} DH</span>
                  </div>
                  {selectedPayment.discountTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Remise</span>
                      <span className="font-medium text-emerald-600">-{selectedPayment.discountTotal.toFixed(2)} DH</span>
                    </div>
                  )}
                  {selectedPayment.appliedAvoirAmount && selectedPayment.appliedAvoirAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Avoir appliqué</span>
                      <span className="font-medium text-violet-600">-{selectedPayment.appliedAvoirAmount.toFixed(2)} DH</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span className="text-gray-700">Net à Payer</span>
                    <span className="text-cyan-600">{selectedPayment.netAmount.toFixed(2)} DH</span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Commercial: <span className="font-medium text-gray-600">{selectedPayment.commercial}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-white">
                    <Printer size={16} />
                    Imprimer
                  </button>
                  {selectedPayment.status === 'paid' && (
                    <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-sm font-medium">
                      <FileCheck size={16} />
                      Reçu
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
