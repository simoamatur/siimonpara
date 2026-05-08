import React, { useEffect, useState } from 'react';
import { CustomerDashboardLayout } from '../components/CustomerDashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { Package, Calendar, Truck, CreditCard, CheckCircle, Clock, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

interface OrderItem {
  id: string;
  quantity: number;
  priceHT: number;
  totalHT: number;
  totalTTC: number;
  product: { id: string; name: string; code: string };
}

interface OrderDetails {
  id: string;
  reference: string;
  date: string;
  statut: string;
  totalHT: number;
  totalTTC: number;
  items: OrderItem[];
}

export const MaCommande: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    axios.get(`/api/client/commandes/${id}`)
      .then((res) => setOrder(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const getStatusStep = (status: string) => {
    const steps: Record<string, number> = {
      'en_attente': 1,
      'confirmée': 2,
      'livrée': 4,
    };
    return steps[status] || 1;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      livrée: 'Livrée',
      confirmée: 'Confirmée',
      en_attente: 'En attente',
      annulée: 'Annulée',
    };
    return labels[status] || status;
  };

  if (!id) {
    return (
      <CustomerDashboardLayout>
        <div className="flex flex-col items-center justify-center py-20">
          <ShoppingCart size={64} className="text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">Nouvelle Commande</h2>
          <p className="text-gray-400 mb-6">Sélectionnez des produits depuis la consultation pour créer une commande</p>
          <Link to="/client/consultation" className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
            Consulter les produits
          </Link>
        </div>
      </CustomerDashboardLayout>
    );
  }

  if (loading) {
    return (
      <CustomerDashboardLayout>
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      </CustomerDashboardLayout>
    );
  }

  if (!order) {
    return (
      <CustomerDashboardLayout>
        <div className="text-center py-20 text-gray-400">Commande non trouvée</div>
      </CustomerDashboardLayout>
    );
  }

  const currentStep = getStatusStep(order.statut);

  const statusSteps = [
    { label: 'Commande reçue', icon: CheckCircle },
    { label: 'Confirmée', icon: Clock },
    { label: 'Expédiée', icon: Truck },
    { label: 'Livrée', icon: Package },
  ];

  return (
    <CustomerDashboardLayout>
      <div className=" mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">
                {order.statut === 'en_attente' ? 'Commande en cours' : 'Détails de la commande'}
              </p>
              <h1 className="text-2xl font-bold text-gray-700">{order.reference}</h1>
              <p className="text-sm text-gray-400 mt-1">
                Passée le {new Date(order.date).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-purple-600">{order.totalTTC.toFixed(2)} Dhs</p>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-amber-100 text-amber-700 mt-2">
                <Clock size={14} />
                {getStatusLabel(order.statut)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-700 mb-6">Suivi de commande</h2>
          <div className="relative">
            <div className="absolute top-5 left-0 right-0 h-1 bg-slate-200 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 to-pink-500 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              />
            </div>
            <div className="relative flex justify-between">
              {statusSteps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber <= currentStep;
                const isCurrent = stepNumber === currentStep;
                return (
                  <div key={step.label} className="flex flex-col items-center">
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isCurrent ? 1.1 : 1,
                      }}
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${isActive ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-400'}`}
                    >
                      <step.icon size={20} />
                    </motion.div>
                    <span className={`text-xs font-semibold ${isActive ? 'text-purple-700' : 'text-slate-400'}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-700">Articles commandés</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {order.items.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Package size={20} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-700">{item.product.name}</p>
                      <p className="text-sm text-gray-400">{item.product.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-700">{item.quantity} × {item.priceHT.toFixed(2)} Dhs</p>
                    <p className="text-sm font-bold text-purple-600">
                      {item.totalTTC.toFixed(2)} Dhs
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Sous-total</span>
                  <span className="font-semibold">{order.totalHT.toFixed(2)} Dhs</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                  <span className="text-gray-700">Total</span>
                  <span className="text-purple-600">{order.totalTTC.toFixed(2)} Dhs</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Package size={16} className="text-purple-600" />
                Statut
              </h3>
              <p className="text-lg font-bold text-gray-700">{getStatusLabel(order.statut)}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl p-6 text-white">
              <h3 className="text-sm font-bold uppercase tracking-wide mb-2 flex items-center gap-2">
                <CreditCard size={16} />
                Total
              </h3>
              <p className="text-lg font-bold">{order.totalTTC.toFixed(2)} Dhs</p>
            </div>
          </div>
        </div>
      </div>
    </CustomerDashboardLayout>
  );
};
