import React, { useState, useEffect } from 'react';
import { CustomerDashboardLayout } from '../components/CustomerDashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { Package, Calendar, CheckCircle, Clock, XCircle, ChevronRight, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface Order {
  id: string;
  reference: string;
  date: string;
  totalTTC: number;
  statut: string;
  _count: { items: number };
}

export const MesCommandes: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/client/commandes')
      .then((res) => setOrders(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(o => o.statut === selectedStatus);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'livrée': return <CheckCircle size={18} className="text-emerald-500" />;
      case 'confirmée': return <Package size={18} className="text-blue-500" />;
      case 'en_attente': return <Clock size={18} className="text-gray-400" />;
      case 'annulée': return <XCircle size={18} className="text-red-500" />;
      default: return <Clock size={18} className="text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'livrée': 'Livrée',
      'confirmée': 'Confirmée',
      'en_attente': 'En attente',
      'annulée': 'Annulée'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'livrée': 'bg-emerald-100 text-emerald-700',
      'confirmée': 'bg-blue-100 text-blue-700',
      'en_attente': 'bg-gray-100 text-gray-600',
      'annulée': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const statusFilters = [
    { value: 'all', label: 'Toutes', count: orders.length },
    { value: 'en_attente', label: 'En attente', count: orders.filter(o => o.statut === 'en_attente').length },
    { value: 'confirmée', label: 'Confirmées', count: orders.filter(o => o.statut === 'confirmée').length },
    { value: 'livrée', label: 'Livrées', count: orders.filter(o => o.statut === 'livrée').length },
    { value: 'annulée', label: 'Annulées', count: orders.filter(o => o.statut === 'annulée').length },
  ];

  const totalSpent = orders.filter(o => o.statut !== 'annulée').reduce((sum, o) => sum + o.totalTTC, 0);

  return (
    <CustomerDashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-semibold text-gray-400 mb-1">Total Commandes</p>
            <p className="text-2xl font-bold text-gray-700">{orders.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-semibold text-gray-400 mb-1">En cours</p>
            <p className="text-2xl font-bold text-purple-600">
              {orders.filter(o => ['en_attente', 'confirmée'].includes(o.statut)).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-semibold text-gray-400 mb-1">Livrées</p>
            <p className="text-2xl font-bold text-emerald-600">
              {orders.filter(o => o.statut === 'livrée').length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <p className="text-sm font-semibold text-gray-400 mb-1">Total Achats</p>
            <p className="text-2xl font-bold text-pink-600">
              {totalSpent.toFixed(2)} Dhs
            </p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setSelectedStatus(filter.value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                selectedStatus === filter.value
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-purple-300'
              }`}
            >
              {filter.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                selectedStatus === filter.value ? 'bg-white/20' : 'bg-gray-100'
              }`}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-700">Historique des commandes</h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-gray-400">Aucune commande trouvée</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 hover:bg-gray-50 transition-colors group cursor-pointer"
                  onClick={() => navigate(`/client/mes-commandes/${order.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${getStatusColor(order.statut)}`}>
                        {getStatusIcon(order.statut)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-700">{order.reference}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar size={14} />
                          {new Date(order.date).toLocaleDateString('fr-FR')}
                          <span>•</span>
                          <span>{order._count.items} article{order._count.items > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-700">{order.totalTTC.toFixed(2)} Dhs</p>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.statut)}`}>
                          {getStatusLabel(order.statut)}
                        </span>
                      </div>
                      <button className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all opacity-0 group-hover:opacity-100">
                        <Eye size={18} className="text-slate-400" />
                      </button>
                      <ChevronRight size={18} className="text-slate-300" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </CustomerDashboardLayout>
  );
};
