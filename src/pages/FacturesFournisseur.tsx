/**
 * Factures Fournisseur - Refactored with UI Components
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import axios from 'axios';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatCard, DataTable, Badge, Modal, Card, Pagination } from '../components/ui';
import {
  Plus, Search, Receipt, Calculator, CheckCircle2, CreditCard, Eye,
  Edit2, Printer, Building2, Calendar, XCircle, Package, ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// ============================================
// TYPES
// ============================================
type InvoiceStatus = 'draft' | 'received' | 'validated' | 'paid' | 'partial' | 'cancelled';
type PaymentMethod = 'cash' | 'check' | 'transfer' | 'credit';

interface InvoiceItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  description?: string;
  quantity: number;
  unit: string;
  priceHT: number;
  discount: number;
  discount2: number;
  tva: number;
  totalHT: number;
  totalTTC: number;
  referenceBR?: string;
}

interface InvoicePayment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  notes?: string;
}

interface FactureFournisseur {
  id: string;
  number: string;
  supplierInvoiceNumber?: string;
  date: string;
  dueDate: string;
  receptionDate: string;
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  supplierCity?: string;
  supplierICE?: string;
  commercial: string;
  items: InvoiceItem[];
  totalHT: number;
  totalDiscount: number;
  totalTVA: number;
  totalTTC: number;
  shippingCost: number;
  otherCosts: number;
  totalPaid: number;
  remaining: number;
  status: InvoiceStatus;
  payments: InvoicePayment[];
  notes?: string;
  terms?: string;
  relatedBRs: string[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// MOCK DATA
// ============================================


const STATUS_CONFIG: Record<InvoiceStatus, { label: string; variant: 'warning' | 'info' | 'success' | 'danger' | 'neutral'; icon: React.ReactNode }> = {
  draft: { label: 'Brouillon', variant: 'neutral', icon: <Package size={14} /> },
  received: { label: 'Reçue', variant: 'warning', icon: <Package size={14} /> },
  validated: { label: 'Validée', variant: 'info', icon: <CheckCircle2 size={14} /> },
  paid: { label: 'Payée', variant: 'success', icon: <CheckCircle2 size={14} /> },
  partial: { label: 'Partiel', variant: 'warning', icon: <CreditCard size={14} /> },
  cancelled: { label: 'Annulée', variant: 'danger', icon: <XCircle size={14} /> },
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'received', label: 'Reçue' },
  { value: 'validated', label: 'Validée' },
  { value: 'paid', label: 'Payée' },
  { value: 'partial', label: 'Partiel' },
  { value: 'cancelled', label: 'Annulée' },
];

// ============================================
// MAIN COMPONENT
// ============================================
interface InvoiceAPI { id: string; reference: string; date: string; dueDate?: string; fournisseur?: { id: string; name?: string; raisonSociale?: string; city?: string }; totalHT: number; totalTVA: number; totalTTC: number; statut: string; items?: any[] }

export const FacturesFournisseur: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<FactureFournisseur | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [invoices, setInvoices] = useState<FactureFournisseur[]>([]);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/achat/factures', { params: { limit: 200 } });
        const data = res.data?.data || res.data || [];
        setInvoices(data.map((inv: InvoiceAPI) => ({
          id: inv.id, number: inv.reference || '', supplierInvoiceNumber: '',
          date: inv.date ? new Date(inv.date).toLocaleDateString('fr-FR') : '',
          dueDate: inv.dueDate ? new Date(inv.dueDate).toLocaleDateString('fr-FR') : '',
          receptionDate: '', supplierId: inv.fournisseur?.id || '', supplierCode: inv.fournisseur?.id || '',
          supplierName: inv.fournisseur?.name || inv.fournisseur?.raisonSociale || '',
          supplierCity: inv.fournisseur?.city || '', supplierAddress: '', supplierPhone: '', supplierEmail: '', supplierICE: '',
          commercial: '', totalHT: inv.totalHT || 0, totalDiscount: 0, totalTVA: inv.totalTVA || 0,
          totalTTC: inv.totalTTC || 0, shippingCost: 0, otherCosts: 0, totalPaid: 0,
          remaining: inv.statut === 'payée' ? 0 : (inv.totalTTC || 0),
          status: (inv.statut === 'payée' ? 'paid' : inv.statut === 'partielle' ? 'partial' : 'received') as InvoiceStatus,
          payments: [], notes: '', terms: '',
          items: (inv.items || []).map((i: any) => ({
            id: i.id, productId: i.productId, productCode: i.product?.code || '',
            productName: i.product?.designation || i.product?.name || '', description: '',
            quantity: i.quantity, unit: '', priceHT: i.priceHT, discount: i.discount || 0,
            tva: i.tva || 20, totalHT: i.totalHT || 0, totalTTC: i.totalTTC || 0,
          })),
        })));
      } catch (err) {
        console.error('Erreur chargement factures fournisseur:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (inv.supplierInvoiceNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter, invoices]);

  const paginatedInvoices = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredInvoices.slice(start, start + itemsPerPage);
  }, [filteredInvoices, currentPage]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

  const handleViewDetail = useCallback((invoice: FactureFournisseur) => {
    setSelectedInvoice(invoice);
    setShowDetailModal(true);
  }, []);

  const handleCreateNew = useCallback(() => {
    navigate('/dashboard/achat/factures/nouvelle');
  }, [navigate]);

  const stats = useMemo(
    () => ({
      total: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.totalTTC, 0),
      paid: invoices.filter((inv) => inv.status === 'paid').length,
      toPay: invoices.reduce((sum, inv) => sum + inv.remaining, 0),
    }),
    [invoices]
  );

  const columns = [
    {
      key: 'number',
      label: 'N° Facture',
      render: (inv: FactureFournisseur) => (
        <div className="flex flex-col">
          <span className="font-semibold text-gray-700">{inv.number}</span>
          <span className="text-xs text-gray-400">{inv.supplierInvoiceNumber}</span>
        </div>
      ),
    },
    {
      key: 'supplierName',
      label: 'Fournisseur',
      render: (inv: FactureFournisseur) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs">
            {inv.supplierName.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-700">{inv.supplierName}</p>
            <p className="text-xs text-gray-400">{inv.supplierCity}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'date',
      label: 'Date',
      render: (inv: FactureFournisseur) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-600">{inv.date}</span>
          <span className="text-xs text-gray-400">Échéance: {inv.dueDate}</span>
        </div>
      ),
    },
    {
      key: 'totalTTC',
      label: 'Montant TTC',
      sortable: true,
      render: (inv: FactureFournisseur) => (
        <span className="font-semibold text-gray-700">{inv.totalTTC.toLocaleString('fr-FR')} DH</span>
      ),
    },
    {
      key: 'remaining',
      label: 'Reste',
      sortable: true,
      render: (inv: FactureFournisseur) => (
        <span className={`font-semibold ${inv.remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          {inv.remaining.toLocaleString('fr-FR')} DH
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Statut',
      render: (inv: FactureFournisseur) => {
        const config = STATUS_CONFIG[inv.status];
        return (
          <span className="inline-flex items-center gap-1.5">
            {config.icon}
            <Badge label={config.label} variant={config.variant} />
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (inv: FactureFournisseur) => (
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => handleViewDetail(inv)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all" title="Voir détails">
            <Eye size={18} />
          </button>
          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Modifier">
            <Edit2 size={18} />
          </button>
          <button className="p-2 text-slate-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-all" title="Imprimer">
            <Printer size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout title="Factures Fournisseur">
      <div className="h-full flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Factures" value={stats.total} icon={<Receipt size={24} />} color="from-amber-500 to-amber-600" />
          <StatCard title="Montant Total" value={`${stats.totalAmount.toLocaleString('fr-FR')} DH`} icon={<Calculator size={24} />} color="from-blue-500 to-blue-600" />
          <StatCard title="Payées" value={stats.paid} icon={<CheckCircle2 size={24} />} color="from-emerald-500 to-emerald-600" />
          <StatCard title="À Payer" value={`${stats.toPay.toLocaleString('fr-FR')} DH`} icon={<CreditCard size={24} />} color="from-orange-500 to-orange-600" />
        </div>

        <Card
          title="Liste des Factures"
          action={
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 w-56 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateNew}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-sm font-medium shadow-lg shadow-amber-500/25"
              >
                <Plus size={16} />
                Nouvelle
              </motion.button>
            </div>
          }
        >
          {loading ? (
            <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <DataTable columns={columns} data={paginatedInvoices} emptyMessage="Aucune facture trouvée" />
          )}
          {!loading && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredInvoices.length} />}
        </Card>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title={selectedInvoice?.number} size="xl">
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <Badge label={STATUS_CONFIG[selectedInvoice.status].label} variant={STATUS_CONFIG[selectedInvoice.status].variant} />
              <span className="text-sm text-gray-400">{selectedInvoice.supplierInvoiceNumber}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Building2 size={16} className="text-amber-500" />
                  Fournisseur
                </h4>
                <p className="font-medium text-gray-700 dark:text-white">{selectedInvoice.supplierName}</p>
                <p className="text-sm text-gray-400">{selectedInvoice.supplierAddress}</p>
                <p className="text-sm text-gray-400">{selectedInvoice.supplierCity}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                <h4 className="font-semibold text-gray-600 dark:text-gray-300 mb-2 flex items-center gap-2">
                  <Calendar size={16} className="text-amber-500" />
                  Dates
                </h4>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-400">Facture:</span> <span className="font-medium">{selectedInvoice.date}</span></p>
                  <p><span className="text-gray-400">Réception:</span> <span className="font-medium">{selectedInvoice.receptionDate}</span></p>
                  <p><span className="text-gray-400">Échéance:</span> <span className="font-medium">{selectedInvoice.dueDate}</span></p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400">Produit</th>
                    <th className="px-4 py-2 text-center text-xs font-semibold text-gray-400">Qté</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Prix HT</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Total HT</th>
                    <th className="px-4 py-2 text-right text-xs font-semibold text-gray-400">Total TTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {selectedInvoice.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-2">
                        <p className="font-medium text-gray-700 dark:text-white">{item.productName}</p>
                        <p className="text-xs text-gray-400">{item.productCode}</p>
                      </td>
                      <td className="px-4 py-2 text-center text-gray-600">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-2 text-right text-gray-600">{item.priceHT.toFixed(2)} DH</td>
                      <td className="px-4 py-2 text-right text-gray-600">{item.totalHT.toFixed(2)} DH</td>
                      <td className="px-4 py-2 text-right font-semibold text-gray-700 dark:text-white">{item.totalTTC.toFixed(2)} DH</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Total HT</span>
                <span className="font-medium">{selectedInvoice.totalHT.toFixed(2)} DH</span>
              </div>
              {selectedInvoice.totalDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Remise</span>
                  <span className="font-medium text-rose-600">-{selectedInvoice.totalDiscount.toFixed(2)} DH</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">TVA</span>
                <span className="font-medium">{selectedInvoice.totalTVA.toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                <span className="text-gray-700 dark:text-white">Total TTC</span>
                <span className="text-amber-600">{selectedInvoice.totalTTC.toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span className="text-gray-600 dark:text-gray-400">Reste à payer</span>
                <span className={selectedInvoice.remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                  {selectedInvoice.remaining.toFixed(2)} DH
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
              <span className="text-sm text-gray-400">Commercial: <span className="font-medium text-gray-600 dark:text-gray-300">{selectedInvoice.commercial}</span></span>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <Printer size={16} />
                  Imprimer
                </button>
                <button
                  onClick={() => navigate(`/dashboard/achat/reglements/nouveau?facture=${selectedInvoice.number}`)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg text-sm font-medium"
                >
                  <CreditCard size={16} />
                  Régler
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};
