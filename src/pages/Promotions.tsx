import React, { useEffect, useState } from 'react';
import { CustomerDashboardLayout } from '../components/CustomerDashboardLayout';
import { Tag, Percent, Clock, ShoppingCart, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';

interface Promotion {
  id: string;
  code: string;
  libelle: string | null;
  type: string;
  valeur: number;
  dateDebut: string;
  dateFin: string;
  actif: boolean;
  produit: { id: string; name: string; sellPrice: number } | null;
}

export const Promotions: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/client/promotions')
      .then((res) => setPromotions(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featuredProducts = promotions
    .filter((p) => p.produit)
    .map((p) => ({
      name: p.produit!.name,
      originalPrice: p.produit!.sellPrice,
      salePrice: p.type === 'remise' ? p.produit!.sellPrice * (1 - p.valeur / 100) : p.produit!.sellPrice,
      discount: p.type === 'remise' ? p.valeur : 0,
      code: p.code,
    }));

  const pastelColors = [
    'from-blue-500 to-cyan-500',
    'from-pink-500 to-rose-500',
    'from-purple-500 to-violet-500',
    'from-emerald-500 to-teal-500',
  ];

  return (
    <CustomerDashboardLayout>
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Tag size={20} className="text-white/80" />
                <span className="text-sm font-bold uppercase tracking-wider text-white/80">Offres Spéciales</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">Promotions en cours</h1>
              <p className="text-white/80">Profitez de nos meilleures offres du moment</p>
            </div>
            <div className="hidden md:block">
              <Percent size={80} className="text-white/20" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div>
              <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                <Tag size={20} className="text-purple-600" />
                Offres actives
              </h2>
              <div className="grid grid-cols-2 gap-6">
                {promotions.length === 0 ? (
                  <div className="col-span-2 text-center text-gray-400 py-12">
                    Aucune promotion active pour le moment
                  </div>
                ) : (
                  promotions.map((promo, index) => (
                    <motion.div
                      key={promo.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition-shadow"
                    >
                      <div className={`h-2 bg-gradient-to-r ${pastelColors[index % pastelColors.length]}`} />
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-700">{promo.libelle || promo.code}</h3>
                            <p className="text-sm text-gray-400 mt-1">
                              {promo.type === 'remise' ? `Remise de ${promo.valeur}%` : 'Offre spéciale'}
                            </p>
                          </div>
                          <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${pastelColors[index % pastelColors.length]} flex items-center justify-center text-white font-bold text-lg`}>
                            {promo.type === 'remise' ? `-${promo.valeur}%` : '%'}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            {promo.produit && (
                              <span className="flex items-center gap-1">
                                <Tag size={14} />
                                {promo.produit.name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              Jusqu'au {new Date(promo.dateFin).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          <button className="flex items-center gap-1 text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors">
                            Voir les produits
                            <ArrowRight size={16} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {featuredProducts.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                  <Percent size={20} className="text-pink-600" />
                  Produits en promotion
                </h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="divide-y divide-slate-100">
                    {featuredProducts.map((product, index) => (
                      <motion.div
                        key={product.code}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                            <Tag size={24} className="text-slate-400" />
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-700">{product.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="px-2 py-0.5 bg-pink-100 text-pink-700 text-xs font-bold rounded">
                                -{product.discount}%
                              </span>
                              <span className="text-sm text-gray-400 line-through">
                                {product.originalPrice.toFixed(2)} Dhs
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <p className="text-xl font-bold text-pink-600">{product.salePrice.toFixed(2)} Dhs</p>
                          <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            <ShoppingCart size={16} />
                            Ajouter
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </CustomerDashboardLayout>
  );
};
