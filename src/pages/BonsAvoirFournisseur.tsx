/**
 * Bons d'Avoir Fournisseur - Modern 2026 Professional ERP Design
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  Plus, Search, Filter, Printer, Download, FileText, Edit2, Trash2, Eye,
  CheckCircle2, XCircle, Clock, Send, ChevronLeft, ChevronRight,
  MinusCircle, RotateCcw, ArrowDownLeft, Tag, Building2,
  Calendar, CheckSquare, Receipt, Percent, DollarSign, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ============================================
// TYPES
// ============================================
type AvoirStatus = 'draft' | 'validated' | 'applied' | 'refunded' | 'cancelled';
type AvoirType = 'commercial' | 'return' | 'discount' | 'quality' | 'other';

interface AvoirItem {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
  discount2: number;
  tva: number;
  totalHT: number;
  totalTTC: number;
  invoiceRef?: string;
}

interface BonAvoirFournisseur {
  id: string;
  number: string;
  date: string;
  dueDate?: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierCity?: string;
  status: AvoirStatus;
  type: AvoirType;
  referenceInvoice?: string;
  items: AvoirItem[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  remainingAmount: number;
  usedAmount: number;
  appliedToInvoices: string[];
  observation?: string;
  commercial: string;
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<AvoirType, { label: string; color: string; icon: React.ReactNode }> = {
  commercial: { label: 'Commercial', color: 'bg-blue-100 text-blue-700', icon: <Percent size={14} /> },
  return: { label: 'Retour', color: 'bg-rose-100 text-rose-700', icon: <RotateCcw size={14} /> },
  discount: { label: 'Remise', color: 'bg-purple-100 text-purple-700', icon: <Tag size={14} /> },
  quality: { label: 'Qualité', color: 'bg-amber-100 text-amber-700', icon: <MinusCircle size={14} /> },
  other: { label: 'Autre', color: 'bg-gray-100 text-gray-600', icon: <Receipt size={14} /> },
};

// ============================================
// UTILITY COMPONENTS
// ============================================
const StatusBadge: React.FC<{ status: AvoirStatus }> = ({ status }) => {
  const configs: Record<AvoirStatus, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <Clock size={14} /> },
    validated: { label: 'Validé', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <CheckSquare size={14} /> },
    applied: { label: 'Appliqué', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle2 size={14} /> },
    refunded: { label: 'Remboursé', color: 'bg-violet-50 text-violet-600 border-violet-200', icon: <DollarSign size={14} /> },
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

const TypeBadge: React.FC<{ type: AvoirType }> = ({ type }) => {
  const config = TYPE_LABELS[type];
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
export const BonsAvoirFournisseur: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AvoirStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<AvoirType | 'all'>('all');
  const [selectedAvoir, setSelectedAvoir] = useState<BonAvoirFournisseur | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [avoirs, setAvoirs] = useState<BonAvoirFournisseur[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/achat/avoirs', { params: { limit: 200 } });
        const data = res.data?.data || res.data || [];
        setAvoirs(data.map((a: any) => ({
          id: a.id,
          number: a.reference || '',
          date: a.date ? new Date(a.date).toLocaleDateString('fr-FR') : '',
          supplierId: a.fournisseur?.id || '',
          supplierCode: a.fournisseur?.code || '',
          supplierName: a.fournisseur?.name || a.fournisseur?.raisonSociale || '',
          supplierCity: a.fournisseur?.ville || '',
          status: a.utilise ? 'applied' : 'validated',
          type: 'return',
          items: [],
          totalHT: a.totalHT || 0,
          totalTVA: 0,
          totalTTC: a.totalTTC || 0,
          remainingAmount: a.utilise ? 0 : (a.totalTTC || 0),
          usedAmount: a.utilise ? (a.totalTTC || 0) : 0,
          appliedToInvoices: [],
          commercial: '',
          createdAt: a.date || '',
          updatedAt: '',
        } as BonAvoirFournisseur)));
      } catch (err) {
        console.error('Erreur chargement avoirs fournisseur:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredAvoirs = useMemo(() => {
    return avoirs.filter(avoir => {
      const matchesSearch = 
        avoir.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        avoir.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        avoir.referenceInvoice?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || avoir.status === statusFilter;
      const matchesType = typeFilter === 'all' || avoir.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [searchQuery, statusFilter, typeFilter]);

  const paginatedAvoirs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAvoirs.slice(start, start + itemsPerPage);
  }, [filteredAvoirs, currentPage]);

  const totalPages = Math.ceil(filteredAvoirs.length / itemsPerPage);

  const handleViewDetail = useCallback((avoir: BonAvoirFournisseur) => {
    setSelectedAvoir(avoir);
    setShowDetailModal(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    navigate('/dashboard/achat/avoirs/nouveau');
  }, [navigate]);

  const stats = useMemo(() => ({
    total: avoirs.length,
    totalAmount: avoirs.reduce((sum, a) => sum + a.totalTTC, 0),
    applied: avoirs.filter(a => a.status === 'applied').length,
    remaining: avoirs.reduce((sum, a) => sum + a.remainingAmount, 0),
  }), []);

  return (
    <DashboardLayout title="Bons d'Avoir Fournisseur">
      <div className="h-full flex flex-col gap-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-violet-500 to-violet-600 rounded-xl p-4 text-white shadow-lg shadow-violet-500/25">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-violet-100 text-sm">Total Avoirs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <MinusCircle size={24} className="text-violet-200" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg shadow-blue-500/25">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Montant Total</p>
                <p className="text-2xl font-bold">{stats.totalAmount.toLocaleString('fr-FR')} DH</p>
              </div>
              <DollarSign size={24} className="text-blue-200" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white shadow-lg shadow-emerald-500/25">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Appliqués</p>
                <p className="text-2xl font-bold">{stats.applied}</p>
              </div>
              <CheckCircle2 size={24} className="text-emerald-200" />
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-4 text-white shadow-lg shadow-amber-500/25">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Reste Disponible</p>
                <p className="text-2xl font-bold">{stats.remaining.toLocaleString('fr-FR')} DH</p>
              </div>
              <Receipt size={24} className="text-amber-200" />
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
                  placeholder="Rechercher par N° avoir, fournisseur, facture..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 w-full"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AvoirStatus | 'all')}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="draft">Brouillon</option>
                <option value="validated">Validé</option>
                <option value="applied">Appliqué</option>
                <option value="refunded">Remboursé</option>
                <option value="cancelled">Annulé</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as AvoirType | 'all')}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="all">Tous les types</option>
                <option value="commercial">Commercial</option>
                <option value="return">Retour</option>
                <option value="discount">Remise</option>
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
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg text-sm font-medium shadow-lg shadow-violet-500/25"
              >
                <Plus size={18} />
                Nouvel Avoir
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
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">N° Avoir</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fournisseur</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Montant TTC</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">Reste</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
  <tr><td colSpan={7} className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-violet-500" /></td></tr>
) : paginatedAvoirs.length === 0 ? (
  <tr><td colSpan={7} className="text-center py-12 text-gray-400">Aucun résultat trouvé</td></tr>
) : paginatedAvoirs.map((avoir) => (
                  <motion.tr
                    key={avoir.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-gray-700">{avoir.number}</span>
                        {avoir.referenceInvoice && (
                          <span className="text-xs text-gray-400">Fact: {avoir.referenceInvoice}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 font-bold text-xs">
                          {avoir.supplierName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-700">{avoir.supplierName}</p>
                          <p className="text-xs text-gray-400">{avoir.supplierCity}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <TypeBadge type={avoir.type} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-gray-700">{avoir.totalTTC.toLocaleString('fr-FR')} DH</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold ${avoir.remainingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {avoir.remainingAmount.toLocaleString('fr-FR')} DH
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={avoir.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleViewDetail(avoir)}
                          className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
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
              Affichage de {paginatedAvoirs.length} sur {filteredAvoirs.length} avoirs
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
        {showDetailModal && selectedAvoir && (
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
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-violet-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MinusCircle size={24} className="text-violet-600" />
                  <div>
                    <h3 className="text-xl font-bold text-gray-700">{selectedAvoir.number}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={selectedAvoir.status} />
                      <TypeBadge type={selectedAvoir.type} />
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
                      <Building2 size={16} className="text-violet-600" />
                      Fournisseur
                    </h4>
                    <p className="font-medium text-gray-700">{selectedAvoir.supplierName}</p>
                    <p className="text-sm text-gray-400">{selectedAvoir.supplierAddress}</p>
                    <p className="text-sm text-gray-400">{selectedAvoir.supplierCity}</p>
                    <p className="text-sm text-gray-400 mt-2">{selectedAvoir.supplierPhone}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-600 mb-3 flex items-center gap-2">
                      <Calendar size={16} className="text-violet-600" />
                      Dates & Référence
                    </h4>
                    <div className="space-y-1">
                      <p className="text-sm"><span className="text-gray-400">Date avoir:</span> <span className="font-medium">{selectedAvoir.date}</span></p>
                      {selectedAvoir.dueDate && (
                        <p className="text-sm"><span className="text-gray-400">Date échéance:</span> <span className="font-medium">{selectedAvoir.dueDate}</span></p>
                      )}
                      {selectedAvoir.referenceInvoice && (
                        <p className="text-sm"><span className="text-gray-400">Facture réf:</span> <span className="font-medium text-violet-600">{selectedAvoir.referenceInvoice}</span></p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Observation */}
                {selectedAvoir.observation && (
                  <div className="bg-violet-50 border border-violet-200 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold text-violet-700 mb-2">Observation</h4>
                    <p className="text-violet-800">{selectedAvoir.observation}</p>
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
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Remise</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Total TTC</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedAvoir.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2">
                            <p className="font-medium text-sm text-gray-700">{item.productName}</p>
                            <p className="text-xs text-gray-400">{item.productCode}</p>
                          </td>
                          <td className="px-4 py-2 text-center text-sm text-gray-600">{item.quantity} {item.unit}</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-600">{item.unitPrice.toFixed(2)} DH</td>
                          <td className="px-4 py-2 text-right text-sm text-gray-600">{item.discount}%</td>
                          <td className="px-4 py-2 text-right text-sm font-semibold text-gray-700">{item.totalTTC.toFixed(2)} DH</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Total HT</span>
                    <span className="font-medium">{selectedAvoir.totalHT.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">TVA</span>
                    <span className="font-medium">{selectedAvoir.totalTVA.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
                    <span className="text-gray-700">Total TTC</span>
                    <span className="text-violet-600">{selectedAvoir.totalTTC.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                    <span className="text-gray-400">Utilisé</span>
                    <span className="font-medium text-emerald-600">{selectedAvoir.usedAmount.toFixed(2)} DH</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold">
                    <span className="text-gray-600">Reste disponible</span>
                    <span className={selectedAvoir.remainingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                      {selectedAvoir.remainingAmount.toFixed(2)} DH
                    </span>
                  </div>
                </div>

                {/* Applied Invoices */}
                {selectedAvoir.appliedToInvoices.length > 0 && (
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <h4 className="font-semibold text-emerald-700 mb-2 flex items-center gap-2">
                      <CheckCircle2 size={16} />
                      Appliqué aux factures
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedAvoir.appliedToInvoices.map((inv, idx) => (
                        <span key={idx} className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded text-xs font-medium">
                          {inv}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Commercial: <span className="font-medium text-gray-600">{selectedAvoir.commercial}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-white">
                    <Printer size={16} />
                    Imprimer
                  </button>
                  {selectedAvoir.remainingAmount > 0 && (
                    <button 
                      onClick={() => navigate(`/dashboard/achat/reglements/nouveau?avoir=${selectedAvoir.number}`)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg text-sm font-medium"
                    >
                      <MinusCircle size={16} />
                      Utiliser
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
