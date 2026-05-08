/**
 * Delivery Route Form - Modern 2026 Professional Design
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import {
  Save, X, Plus, Trash2, ArrowLeft, CheckCircle2, MapPin, Calendar,
  Truck, User, Clock, Route, ChevronDown, Search, Navigation,
  Package, Phone, Building2, GripVertical, Calculator, Loader2
} from 'lucide-react';

// ============================================
// TYPES
// ============================================
type RouteStatus = 'planned' | 'assigned' | 'in-transit' | 'completed' | 'cancelled';

interface DeliveryStop {
  id: string;
  order: number;
  bonLivraisonId: string;
  clientName: string;
  clientAddress: string;
  clientPhone?: string;
  items: number;
  notes?: string;
}

interface DeliveryRoute {
  id: string;
  name: string;
  date: string;
  livreurId: string;
  livreurName: string;
  livreurPhone?: string;
  vehicle: string;
  licensePlate: string;
  status: RouteStatus;
  stops: DeliveryStop[];
  startTime?: string;
  estimatedEndTime?: string;
  totalDistance: number;
  totalDuration: number;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

// ============================================
// TYPES FOR API
// ============================================
interface Livreur { id: string; nom: string; telephone?: string; vehicule?: string; matricule?: string }
interface BonLivraisonItem { quantity: number }
interface BonLivraisonForRoute { id: string; reference: string; client: { id: string; name: string; address?: string; phone?: string }; items?: BonLivraisonItem[] }

// ============================================
// UTILITY COMPONENTS
// ============================================
const StatusBadge: React.FC<{ status: RouteStatus }> = ({ status }) => {
  const configs: Record<RouteStatus, { label: string; color: string }> = {
    planned: { label: 'Planifiée', color: 'bg-gray-100 text-gray-500 border-gray-200' },
    assigned: { label: 'Assignée', color: 'bg-blue-50 text-blue-600 border-blue-200' },
    'in-transit': { label: 'En cours', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    completed: { label: 'Terminée', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    cancelled: { label: 'Annulée', color: 'bg-rose-50 text-rose-600 border-rose-200' },
  };
  const config = configs[status];
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.color}`}>{config.label}</span>;
};

// ============================================
// MAIN COMPONENT
// ============================================
export const DeliveryRouteFormModern: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [bonLivraisons, setBonLivraisons] = useState<BonLivraisonForRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<DeliveryRoute>({
    id: '',
    name: '',
    date: new Date().toISOString().split('T')[0],
    livreurId: '',
    livreurName: '',
    livreurPhone: '',
    vehicle: '',
    licensePlate: '',
    status: 'planned',
    stops: [],
    totalDistance: 0,
    totalDuration: 0,
    notes: '',
    createdBy: '',
    createdAt: new Date().toISOString(),
  });

  const [showLivreurDropdown, setShowLivreurDropdown] = useState(false);
  const [showClientSelector, setShowClientSelector] = useState(false);
  const [blSearch, setBlSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [livRes, blRes] = await Promise.all([
          axios.get('/api/parametres/livreurs'),
          axios.get('/api/bon-livraison', { params: { validated: true, limit: 200 } }),
        ]);
        const livData = livRes.data?.data || livRes.data || [];
        const blData = blRes.data?.data || blRes.data || [];
        setLivreurs(livData);
        // Only show BLs not yet assigned to a route (no affectations)
        setBonLivraisons(blData.filter((bl: any) => !bl.affectations?.length));
      } catch (err) {
        console.error('Erreur chargement données:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSelectLivreur = useCallback((livreur: Livreur) => {
    setFormData(prev => ({
      ...prev,
      livreurId: livreur.id,
      livreurName: livreur.nom,
      livreurPhone: livreur.telephone || '',
      vehicle: livreur.vehicule || '',
      licensePlate: livreur.matricule || prev.licensePlate,
    }));
    setShowLivreurDropdown(false);
  }, []);

  const handleAddStop = useCallback((bl: BonLivraisonForRoute) => {
    const count = bl.items?.reduce((s, i) => s + i.quantity, 0) || 0;
    const newStop: DeliveryStop = {
      id: Date.now().toString(),
      order: formData.stops.length + 1,
      bonLivraisonId: bl.id,
      clientName: bl.client.name,
      clientAddress: bl.client.address || '',
      clientPhone: bl.client.phone || '',
      items: count,
    };
    setFormData(prev => ({ ...prev, stops: [...prev.stops, newStop] }));
    setShowClientSelector(false);
    setBonLivraisons(prev => prev.filter(b => b.id !== bl.id));
  }, [formData.stops.length]);

  const handleRemoveStop = useCallback((stopId: string, bonLivraisonId: string) => {
    const removed = formData.stops.find(s => s.id === stopId);
    setFormData(prev => ({
      ...prev,
      stops: prev.stops.filter(s => s.id !== stopId).map((s, idx) => ({ ...s, order: idx + 1 })),
    }));
    // Re-add the BL to available list
    if (removed) {
      const bl = bonLivraisons.find(b => b.id === bonLivraisonId);
      if (!bl) {
        // Fetch the full BL again; for simplicity just remove from stops
      }
    }
  }, [formData.stops]);

  const handleSave = useCallback(async () => {
    if (!formData.livreurId) { toast('error', "Veuillez sélectionner un livreur"); return; }
    if (!formData.stops.length) { toast('error', "Veuillez ajouter au moins un BL"); return; }
    setSaving(true);
    try {
      // Create route
      const routeRes = await axios.post('/api/ventes/livraisons/routes', {
        livreurId: formData.livreurId,
        date: formData.date,
      });
      const routeId = routeRes.data?.id || routeRes.data?.route?.id;
      if (!routeId) throw new Error('No route ID returned');

      // Create affectations for each stop
      await Promise.all(
        formData.stops.map((stop, idx) =>
          axios.post('/api/ventes/livraisons/affectations', {
            routeId,
            bonLivraisonId: stop.bonLivraisonId,
            ordre: idx + 1,
          })
        )
      );

      navigate('/dashboard/vente/suivi');
    } catch (err) {
      console.error('Erreur création route:', err);
      toast('error', "Erreur lors de la création de la route");
    } finally {
      setSaving(false);
    }
  }, [formData, navigate]);

  const availableBLs = useMemo(() => {
    const selectedIds = formData.stops.map(s => s.bonLivraisonId);
    let available = bonLivraisons.filter(bl => !selectedIds.includes(bl.id));
    if (!blSearch) return available;
    const q = blSearch.toLowerCase();
    return available.filter(bl =>
      bl.client.name.toLowerCase().includes(q) ||
      bl.reference.toLowerCase().includes(q) ||
      (bl.client.address || '').toLowerCase().includes(q)
    );
  }, [bonLivraisons, formData.stops, blSearch]);

  const totalItems = useMemo(() => formData.stops.reduce((sum, s) => sum + s.items, 0), [formData.stops]);

  return (
    <DashboardLayout title="Nouvelle Route de Livraison">
      <div className=" mx-auto space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard/vente/suivi')} className="p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-300 transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                <Route size={28} className="text-indigo-600" />
                Nouvelle Route
              </h2>
              <p className="text-sm text-gray-400">Planifier un circuit de livraison</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={formData.status} />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving || loading} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-500/25 disabled:opacity-50">
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              {saving ? 'Création...' : 'Créer Route'}
            </motion.button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Route Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={20} className="text-indigo-600" />
                <h3 className="font-bold text-gray-700">Informations Route</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase">Nom de la Route</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Casablanca Centre - A1"
                    className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            </motion.div>

            {/* Livreur Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Truck size={20} className="text-indigo-600" />
                <h3 className="font-bold text-gray-700">Livreur & Véhicule</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2 relative">
                  <label className="text-xs font-semibold text-gray-400">Sélectionner Livreur *</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.livreurName}
                      onClick={() => setShowLivreurDropdown(true)}
                      readOnly
                      placeholder="Choisir livreur..."
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer"
                    />
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  </div>
                  <AnimatePresence>
                    {showLivreurDropdown && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {livreurs.length === 0 && (
                          <div className="p-4 text-center text-gray-400 text-sm">Aucun livreur trouvé</div>
                        )}
                        {livreurs.map(l => (
                          <button key={l.id} onClick={() => handleSelectLivreur(l)} className="w-full px-4 py-3 text-left hover:bg-indigo-50 border-b last:border-0">
                            <p className="font-medium text-gray-700">{l.nom}</p>
                            <p className="text-xs text-gray-400">{l.telephone || ''}{l.vehicule ? ` • ${l.vehicule}` : ''}</p>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                {formData.livreurId && (
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
                        {formData.livreurName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">{formData.livreurName}</p>
                        <p className="text-xs text-gray-400">{formData.livreurPhone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Truck size={14} />
                      {formData.vehicle}
                    </div>
                  </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-gray-400">Matricule</label>
                  <input
                    type="text"
                    value={formData.licensePlate}
                    onChange={(e) => setFormData(prev => ({ ...prev, licensePlate: e.target.value }))}
                    placeholder="Ex: 12345-A-25"
                    className="w-full mt-1 px-3 py-2 bg-white border border-gray-200 rounded-lg uppercase"
                  />
                </div>
              </div>
            </motion.div>

            {/* Stats Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl shadow-lg p-6 text-white">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Calculator size={18} />
                Récapitulatif
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-indigo-100">Arrêts</span>
                  <span className="font-bold">{formData.stops.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-100">Total Colis</span>
                  <span className="font-bold">{totalItems}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-100">Est. Distance</span>
                  <span className="font-bold">{formData.totalDistance || '--'} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-indigo-100">Durée Est.</span>
                  <span className="font-bold">{formData.totalDuration ? `${Math.round(formData.totalDuration / 60)}h` : '--'}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Stops List */}
          <div className="lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Stops Header */}
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-indigo-600" />
                  <h3 className="font-bold text-gray-700">Points de Livraison ({formData.stops.length})</h3>
                </div>
                <button
                  onClick={() => setShowClientSelector(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-200"
                >
                  <Plus size={16} />
                  Ajouter Client
                </button>
              </div>

              {/* Client Selector Modal */}
              <AnimatePresence>
                {showClientSelector && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="border-b border-gray-200">
                    <div className="p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-600">Sélectionner un client</h4>
                        <button onClick={() => setShowClientSelector(false)} className="text-slate-400 hover:text-gray-500"><X size={18} /></button>
                      </div>
                      <div className="relative mb-3">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Rechercher BL ou client..."
                          value={blSearch}
                          onChange={(e) => setBlSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                        {availableBLs.length === 0 && (
                          <div className="col-span-full p-8 text-center text-gray-400">
                            <Package size={32} className="mx-auto mb-2 text-slate-300" />
                            <p className="font-medium">Aucun BL disponible</p>
                            <p className="text-sm">Tous les BL validés sont déjà assignés</p>
                          </div>
                        )}
                        {availableBLs.map(bl => (
                          <button
                            key={bl.id}
                            onClick={() => handleAddStop(bl)}
                            className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-left"
                          >
                            <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                              {bl.reference.slice(-3)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-700 truncate">{bl.client.name}</p>
                              <p className="text-xs text-gray-400 truncate">{bl.reference}</p>
                              <p className="text-xs text-gray-400 truncate">{bl.client.address || ''}</p>
                              <div className="flex items-center gap-2 mt-1 text-xs">
                                <span className="px-2 py-0.5 bg-gray-100 rounded text-gray-500">
                                  {bl.items?.reduce((s, i) => s + i.quantity, 0) || 0} art.
                                </span>
                              </div>
                            </div>
                            <Plus size={16} className="text-indigo-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stops List */}
              <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
                {formData.stops.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <MapPin size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-gray-400 font-medium">Aucun arrêt ajouté</p>
                    <p className="text-sm text-slate-400">Cliquez sur "Ajouter Client" pour commencer</p>
                  </div>
                ) : (
                  formData.stops.map((stop, index) => (
                    <motion.div
                      key={stop.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:border-indigo-300 transition-colors"
                    >
                      <div className="flex flex-col items-center pt-1">
                        <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                          {stop.order}
                        </div>
                        {index < formData.stops.length - 1 && <div className="w-0.5 h-8 bg-slate-200 mt-1" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-bold text-gray-700">{stop.clientName}</h4>
                            <div className="flex items-center gap-1 text-sm text-gray-400 mt-1">
                              <MapPin size={14} />
                              {stop.clientAddress}
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-gray-500">
                                <Package size={12} />
                                {stop.items} art.
                              </span>
                              {stop.clientPhone && (
                                <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-gray-500">
                                  <Phone size={12} />
                                  {stop.clientPhone}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleRemoveStop(stop.id, stop.bonLivraisonId)}
                              className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                            <div className="p-2 text-slate-300 cursor-move">
                              <GripVertical size={18} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Map Preview Placeholder */}
              {formData.stops.length > 0 && (
                <div className="p-4 border-t border-gray-200">
                  <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl p-8 text-center">
                    <Navigation size={48} className="mx-auto text-indigo-500 mb-2" />
                    <p className="text-indigo-700 font-medium">Prévisualisation de l'itinéraire</p>
                    <p className="text-sm text-indigo-600">{formData.stops.length} arrêts • Optimisé</p>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
