import React, { useEffect, useState } from 'react';
import { CustomerDashboardLayout } from '../components/CustomerDashboardLayout';
import { motion } from 'framer-motion';
import {
  Package, ShoppingCart, CreditCard, TrendingUp, Clock,
  CheckCircle2, AlertCircle, ChevronRight, Calendar,
  Receipt, Truck, Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface DashboardData {
  name: string;
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  deliveredOrders: number;
  unpaidInvoices: number;
  creditLimit: number;
  currentBalance: number;
  recentOrders: { id: string; reference: string; date: string; status: string; total: number; items: number }[];
  unpaidInvoicesList: { id: string; reference: string; dueDate: string; amount: number; status: string }[];
  promotions: { id: string; title: string; validUntil: string; code: string }[];
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    livrée: { label: 'Livré', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 size={14} /> },
    confirmée: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700', icon: <Package size={14} /> },
    en_attente: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: <Clock size={14} /> },
    annulée: { label: 'Annulée', color: 'bg-rose-100 text-rose-700', icon: <AlertCircle size={14} /> },
    impayée: { label: 'Non payée', color: 'bg-rose-100 text-rose-700', icon: <AlertCircle size={14} /> },
    partielle: { label: 'Partiel', color: 'bg-orange-100 text-orange-700', icon: <CreditCard size={14} /> },
  };
  const config = configs[status] || configs.en_attente;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

export const ClientPanel: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/client/dashboard')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <CustomerDashboardLayout>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white shadow-lg"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-yellow-300" />
              <span className="text-sm font-medium text-purple-100">Bienvenue</span>
            </div>
            <h1 className="text-2xl font-bold mb-1">Bonjour, {data?.name || 'Client'}</h1>
            <p className="text-purple-100">Voici un aperçu de votre activité</p>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Commandes Totales', value: data.totalOrders, icon: ShoppingCart, color: 'from-blue-500 to-cyan-500' },
                { label: 'Total Achats', value: `${data.totalSpent.toLocaleString('fr-FR')} DH`, icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
                { label: 'En Cours', value: data.pendingOrders, icon: Package, color: 'from-amber-500 to-orange-500' },
                { label: 'Livrées', value: data.deliveredOrders, icon: CheckCircle2, color: 'from-purple-500 to-pink-500' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center text-white mb-3`}>
                    <stat.icon size={20} />
                  </div>
                  <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-700">{stat.value}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm"
              >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <ShoppingCart size={18} className="text-purple-600" />
                    Commandes Récentes
                  </h3>
                  <Link to="/client/mes-commandes" className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
                    Voir tout <ChevronRight size={16} />
                  </Link>
                </div>
                <div className="divide-y divide-slate-100">
                  {data.recentOrders.map((order) => (
                    <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div>
                        <p className="font-semibold text-gray-700">{order.reference}</p>
                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {new Date(order.date).toLocaleDateString('fr-FR')}
                          </span>
                          <span>{order.items} articles</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <StatusBadge status={order.status} />
                        <p className="font-bold text-gray-700 mt-1">{order.total.toLocaleString('fr-FR')} DH</p>
                      </div>
                    </div>
                  ))}
                  {data.recentOrders.length === 0 && (
                    <div className="p-6 text-center text-gray-400 text-sm">Aucune commande récente</div>
                  )}
                </div>
              </motion.div>

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                >
                  <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <CreditCard size={18} className="text-emerald-600" />
                    Solde & Crédit
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Limite de crédit</span>
                      <span className="font-semibold">{data.creditLimit.toLocaleString('fr-FR')} DH</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Solde actuel</span>
                      <span className="font-semibold text-rose-600">{data.currentBalance.toLocaleString('fr-FR')} DH</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                        style={{ width: `${data.creditLimit > 0 ? ((data.creditLimit - data.currentBalance) / data.creditLimit) * 100 : 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400">
                      Crédit disponible: {Math.max(0, data.creditLimit - data.currentBalance).toLocaleString('fr-FR')} DH
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
                >
                  <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                    <Receipt size={18} className="text-rose-600" />
                    Factures Impayées
                  </h3>
                  <div className="space-y-3">
                    {data.unpaidInvoicesList.map((invoice) => (
                      <div key={invoice.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-700">{invoice.reference}</span>
                          <StatusBadge status={invoice.status} />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Échéance: {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('fr-FR') : 'N/A'}</span>
                          <span className="font-bold text-gray-700">{invoice.amount.toLocaleString('fr-FR')} DH</span>
                        </div>
                      </div>
                    ))}
                    {data.unpaidInvoicesList.length === 0 && (
                      <p className="text-center text-gray-400 text-sm py-2">Aucune facture impayée</p>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-4"
                >
                  <h3 className="font-bold text-purple-800 mb-4 flex items-center gap-2">
                    <Sparkles size={18} className="text-purple-600" />
                    Promotions Actives
                  </h3>
                  <div className="space-y-3">
                    {data.promotions.map((promo) => (
                      <div key={promo.id} className="p-3 bg-white/70 rounded-lg">
                        <p className="font-medium text-gray-700 text-sm">{promo.title}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400">
                            Valide jusqu'au {new Date(promo.validUntil).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="text-xs font-bold text-purple-600 bg-purple-100 px-2 py-1 rounded">
                            {promo.code}
                          </span>
                        </div>
                      </div>
                    ))}
                    {data.promotions.length === 0 && (
                      <p className="text-center text-gray-400 text-sm py-2">Aucune promotion active</p>
                    )}
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">Erreur lors du chargement des données</div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { label: 'Nouvelle Commande', icon: ShoppingCart, path: '/client/commande', color: 'bg-purple-100 text-purple-600' },
            { label: 'Consulter Produits', icon: Package, path: '/client/consultation', color: 'bg-blue-100 text-blue-600' },
            { label: 'Suivi Livraison', icon: Truck, path: '/client/mes-commandes', color: 'bg-amber-100 text-amber-600' },
            { label: 'Mon Profil', icon: Sparkles, path: '/client/profile', color: 'bg-emerald-100 text-emerald-600' },
          ].map((action, i) => (
            <Link
              key={action.label}
              to={action.path}
              className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all"
            >
              <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center`}>
                <action.icon size={20} />
              </div>
              <span className="font-medium text-gray-600 text-sm">{action.label}</span>
            </Link>
          ))}
        </motion.div>
      </div>
    </CustomerDashboardLayout>
  );
};
