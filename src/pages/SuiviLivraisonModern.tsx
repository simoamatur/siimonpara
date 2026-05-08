/**
 * Suivi de Livraison - Modern 2026 Professional ERP Design
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  Search, Filter, Printer, Download, MapPin, Truck, Eye, CheckCircle2, XCircle, Clock,
  ChevronLeft, ChevronRight, ArrowUpDown, Navigation, Phone, Calendar, User,
  Package, Route, AlertTriangle, TrendingUp, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// TYPES
// ============================================
type DeliveryStatus = 'pending' | 'assigned' | 'in-transit' | 'delivered' | 'failed' | 'cancelled';
type Priority = 'normal' | 'high' | 'urgent';

interface DeliveryStop {
  id: string;
  order: number;
  clientId: string;
  clientName: string;
  clientAddress: string;
  clientPhone?: string;
  city: string;
  zone: string;
  items: number;
  status: DeliveryStatus;
  estimatedTime?: string;
  actualTime?: string;
  notes?: string;
  signature?: boolean;
  photo?: boolean;
}

interface DeliveryRoute {
  id: string;
  name: string;
  date: string;
  livreur: string;
  livreurPhone?: string;
  vehicle?: string;
  licensePlate?: string;
  stops: DeliveryStop[];
  status: DeliveryStatus;
  startTime?: string;
  endTime?: string;
  totalDistance?: number;
  totalDuration?: number;
  createdAt: string;
  updatedAt: string;
}

const VALID_STATUSES: DeliveryStatus[] = ['pending', 'assigned', 'in-transit', 'delivered', 'failed', 'cancelled'];

const toDeliveryStatus = (s: string): DeliveryStatus =>
  VALID_STATUSES.includes(s as DeliveryStatus) ? (s as DeliveryStatus) : 'pending';

const mapRoute = (item: any): DeliveryRoute => ({
  id: String(item.id),
  name: item.reference || '',
  date: item.date || '',
  livreur: item.livreur?.nom || '',
  livreurPhone: item.livreur?.telephone || undefined,
  vehicle: undefined,
  licensePlate: undefined,
  stops: (item.affectations || []).map((aff: any, idx: number) => ({
    id: String(aff.id),
    order: aff.ordre ?? (idx + 1),
    clientId: String(aff.bonLivraison?.client?.id ?? ''),
    clientName: aff.bonLivraison?.client?.name || '',
    clientAddress: aff.bonLivraison?.client?.address || '',
    clientPhone: aff.bonLivraison?.client?.phone || undefined,
    city: '',
    zone: '',
    items: 0,
    status: toDeliveryStatus(aff.statutLivraison),
    estimatedTime: undefined,
    actualTime: undefined,
    notes: undefined,
    signature: false,
    photo: false,
  })),
  status: toDeliveryStatus(item.statut),
  startTime: undefined,
  endTime: undefined,
  totalDistance: undefined,
  totalDuration: undefined,
  createdAt: item.createdAt || '',
  updatedAt: item.updatedAt || '',
});

// ============================================
// UTILITY COMPONENTS
// ============================================
const StatusBadge: React.FC<{ status: DeliveryStatus }> = ({ status }) => {
  const configs: Record<DeliveryStatus, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: 'En attente', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <Clock size={14} /> },
    assigned: { label: 'Assigné', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <User size={14} /> },
    'in-transit': { label: 'En cours', color: 'bg-amber-50 text-amber-600 border-amber-200', icon: <Truck size={14} /> },
    delivered: { label: 'Livré', color: 'bg-emerald-50 text-emerald-600 border-emerald-200', icon: <CheckCircle2 size={14} /> },
    failed: { label: 'Échoué', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: <XCircle size={14} /> },
    cancelled: { label: 'Annulé', color: 'bg-gray-50 text-gray-600 border-gray-200', icon: <AlertTriangle size={14} /> },
  };
  const config = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

const StopStatusBadge: React.FC<{ status: DeliveryStatus }> = ({ status }) => {
  const colors: Record<DeliveryStatus, string> = {
    pending: 'bg-gray-100 text-gray-500',
    assigned: 'bg-blue-100 text-blue-600',
    'in-transit': 'bg-amber-100 text-amber-600',
    delivered: 'bg-emerald-100 text-emerald-600',
    failed: 'bg-rose-100 text-rose-600',
    cancelled: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${colors[status]}`}>
      {status === 'delivered' ? '\u2713' : status === 'failed' ? '\u2717' : status === 'cancelled' ? '-' : status === 'in-transit' ? '\u2192' : '\u25CB'}
    </span>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================
export const SuiviLivraisonModern: React.FC = () => {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DeliveryStatus | 'all'>('all');
  const [livreurFilter, setLivreurFilter] = useState<string>('all');
  const [selectedRoute, setSelectedRoute] = useState<DeliveryRoute | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'livreur' | 'stops'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    let cancelled = false;
    const fetchRoutes = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/ventes/livraisons/routes');
        if (cancelled) return;
        const raw = res.data?.data ?? res.data;
        const arr = Array.isArray(raw) ? raw : [];
        setRoutes(arr.map(mapRoute));
      } catch (err) {
        if (!cancelled) console.error('Erreur lors du chargement des routes', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchRoutes();
    return () => { cancelled = true; };
  }, []);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayRoutes = routes.filter(r => r.date === today);

    return {
      total: routes.length,
      today: todayRoutes.length,
      inTransit: todayRoutes.filter(r => r.status === 'in-transit').length,
      delivered: todayRoutes.filter(r => r.status === 'delivered').length,
      pending: todayRoutes.filter(r => r.status === 'pending' || r.status === 'assigned').length,
      totalStops: todayRoutes.reduce((acc, r) => acc + r.stops.length, 0),
      deliveredStops: todayRoutes.reduce((acc, r) => acc + r.stops.filter(s => s.status === 'delivered').length, 0),
      successRate: todayRoutes.length > 0
        ? Math.round((todayRoutes.reduce((acc, r) => acc + r.stops.filter(s => s.status === 'delivered').length, 0) /
            todayRoutes.reduce((acc, r) => acc + r.stops.filter(s => s.status !== 'cancelled').length, 0)) * 100)
        : 0,
    };
  }, [routes]);

  // Filtered and sorted data
  const filteredRoutes = useMemo(() => {
    let result = [...routes];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r =>
        r.name.toLowerCase().includes(query) ||
        r.livreur.toLowerCase().includes(query) ||
        r.stops.some(s => s.clientName.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

    if (livreurFilter !== 'all') {
      result = result.filter(r => r.livreur === livreurFilter);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortBy === 'livreur') comparison = a.livreur.localeCompare(b.livreur);
      else if (sortBy === 'stops') comparison = a.stops.length - b.stops.length;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [routes, searchQuery, statusFilter, livreurFilter, sortBy, sortOrder]);

  const livreurs = useMemo(() => Array.from(new Set(routes.map(r => r.livreur))), [routes]);

  const handleViewRoute = useCallback((route: DeliveryRoute) => {
    setSelectedRoute(route);
  }, []);

  const handleUpdateStopStatus = useCallback(async (routeId: string, stopId: string, newStatus: DeliveryStatus) => {
    let computedStatus: DeliveryStatus = 'pending';
    setRoutes(prev => prev.map(r => {
      if (r.id !== routeId) return r;
      const updatedStops = r.stops.map(s => s.id === stopId ? { ...s, status: newStatus, actualTime: newStatus === 'delivered' ? new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : s.actualTime } : s);
      const allDelivered = updatedStops.every(s => s.status === 'delivered' || s.status === 'cancelled');
      const hasInTransit = updatedStops.some(s => s.status === 'in-transit');
      computedStatus = allDelivered ? 'delivered' : hasInTransit ? 'in-transit' : r.status;
      return {
        ...r,
        stops: updatedStops,
        status: computedStatus,
        updatedAt: new Date().toISOString(),
      };
    }));
    try {
      await axios.put(`/api/ventes/livraisons/routes/${routeId}/statut`, { statut: computedStatus });
    } catch (err) {
      console.error('Erreur mise à jour statut route', err);
    }
  }, []);

  // Render Loading
  const renderLoading = () => (
    <div className="flex items-center justify-center py-24">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={40} className="text-indigo-500 animate-spin" />
        <p className="text-gray-400 font-medium">Chargement des routes...</p>
      </div>
    </div>
  );

  // Render List View
  const renderList = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Routes Total', value: stats.total, icon: Route },
          { label: "Aujourd'hui", value: stats.today, icon: Calendar },
          { label: 'En cours', value: stats.inTransit, icon: Truck },
          { label: 'Livrés', value: stats.delivered, icon: CheckCircle2 },
          { label: 'En attente', value: stats.pending, icon: Clock },
          { label: 'Arrêts Total', value: stats.totalStops, icon: MapPin },
          { label: 'Arrêts Livrés', value: stats.deliveredStops, icon: CheckCircle2 },
          { label: 'Taux Succès', value: `${stats.successRate}%`, icon: TrendingUp },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="relative overflow-hidden rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-3"
          >
            <div className="flex flex-col">
              <p className="text-[10px] text-gray-400 uppercase">{stat.label}</p>
              <p className="text-sm font-bold text-gray-700">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher route, livreur, client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DeliveryStatus | 'all')}
            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
          >
            <option value="all">Tous statuts</option>
            <option value="pending">En attente</option>
            <option value="assigned">Assigné</option>
            <option value="in-transit">En cours</option>
            <option value="delivered">Terminé</option>
          </select>

          <select
            value={livreurFilter}
            onChange={(e) => setLivreurFilter(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm"
          >
            <option value="all">Tous livreurs</option>
            {livreurs.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-slate-700 rounded-lg text-sm text-gray-500 hover:text-emerald-600">
            <Download size={16} />
            Export
          </button>
          <button onClick={() => navigate('/dashboard/vente/suivi/nouvelle-route')} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg font-medium shadow-lg shadow-indigo-500/25">
            <Truck size={18} />
            Nouvelle Route
          </button>
        </div>
      </div>

      {/* Routes List */}
      <div className="space-y-4">
        {filteredRoutes.map((route, index) => (
          <motion.div
            key={route.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm"
          >
            {/* Route Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white">
                    <Truck size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-700">{route.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <Calendar size={14} />
                      {new Date(route.date).toLocaleDateString('fr-FR')}
                      <span className="mx-1">&bull;</span>
                      <User size={14} />
                      {route.livreur}
                      {route.vehicle && (
                        <>
                          <span className="mx-1">&bull;</span>
                          <span>{route.vehicle} ({route.licensePlate})</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={route.status} />
                  <button
                    onClick={() => handleViewRoute(route)}
                    className="p-2 rounded-lg hover:bg-slate-200 text-gray-500"
                  >
                    <Eye size={20} />
                  </button>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="px-4 py-2 bg-white">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    style={{
                      width: `${(route.stops.filter(s => s.status === 'delivered').length / route.stops.length) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-500">
                  {route.stops.filter(s => s.status === 'delivered').length}/{route.stops.length}
                </span>
              </div>
            </div>

            {/* Stops Preview */}
            <div className="p-4 bg-gray-50/50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {route.stops.map((stop, idx) => (
                  <div
                    key={stop.id}
                    className={`p-3 rounded-lg border ${
                      stop.status === 'delivered' ? 'bg-emerald-50 border-emerald-200' :
                      stop.status === 'in-transit' ? 'bg-amber-50 border-amber-200' :
                      stop.status === 'failed' ? 'bg-rose-50 border-rose-200' :
                      'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <StopStatusBadge status={stop.status} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-700 truncate">{stop.clientName}</p>
                        <p className="text-xs text-gray-400 truncate">{stop.city} - {stop.zone}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-400">{stop.estimatedTime}</span>
                          {stop.actualTime && (
                            <span className="text-xs text-emerald-600">&#10003; {stop.actualTime}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}

        {filteredRoutes.length === 0 && (
          <div className="p-12 text-center bg-white rounded-xl border border-gray-200">
            <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gray-100 flex items-center justify-center">
              <Route size={32} className="text-slate-400" />
            </div>
            <p className="text-gray-400 font-medium">Aucune route trouvée</p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Detail View
  const renderDetail = () => {
    if (!selectedRoute) return null;
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className=" mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setSelectedRoute(null)} className="p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-emerald-600">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-700">{selectedRoute.name}</h2>
            <p className="text-sm text-gray-400">{selectedRoute.livreur} &bull; {new Date(selectedRoute.date).toLocaleDateString('fr-FR')}</p>
          </div>
          <StatusBadge status={selectedRoute.status} />
        </div>

        {/* Map Placeholder */}
        <div className="bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl border border-indigo-200 p-8 mb-6">
          <div className="text-center">
            <Navigation size={48} className="mx-auto text-indigo-500 mb-2" />
            <p className="text-indigo-700 font-medium">Carte de la route</p>
            <p className="text-sm text-indigo-600">{selectedRoute.totalDistance} km &bull; {Math.round((selectedRoute.totalDuration || 0) / 60)}h {((selectedRoute.totalDuration || 0) % 60)}min</p>
          </div>
        </div>

        {/* Stops Detail */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h3 className="font-semibold text-gray-600">Arrêts ({selectedRoute.stops.length})</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {selectedRoute.stops.map((stop, idx) => (
              <div key={stop.id} className="p-4 flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <StopStatusBadge status={stop.status} />
                  {idx < selectedRoute.stops.length - 1 && <div className="w-0.5 h-16 bg-slate-200 mt-2" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-gray-700">{stop.clientName}</h4>
                      <p className="text-sm text-gray-400">{stop.clientAddress}</p>
                      <div className="flex items-center gap-3 mt-2 text-sm">
                        <span className="flex items-center gap-1 text-gray-500">
                          <MapPin size={14} /> {stop.city}, {stop.zone}
                        </span>
                        {stop.clientPhone && (
                          <span className="flex items-center gap-1 text-gray-500">
                            <Phone size={14} /> {stop.clientPhone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-500">{stop.estimatedTime}</p>
                      {stop.actualTime && (
                        <p className="text-sm text-emerald-600">Livré à {stop.actualTime}</p>
                      )}
                    </div>
                  </div>

                  {stop.notes && (
                    <p className="mt-2 text-sm text-rose-600 bg-rose-50 p-2 rounded">{stop.notes}</p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-3">
                    {stop.status === 'pending' && (
                      <button
                        onClick={() => handleUpdateStopStatus(selectedRoute.id, stop.id, 'in-transit')}
                        className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-200"
                      >
                        D&eacute;marrer
                      </button>
                    )}
                    {stop.status === 'in-transit' && (
                      <>
                        <button
                          onClick={() => handleUpdateStopStatus(selectedRoute.id, stop.id, 'delivered')}
                          className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium hover:bg-emerald-200"
                        >
                          Livr&eacute; &#10003;
                        </button>
                        <button
                          onClick={() => handleUpdateStopStatus(selectedRoute.id, stop.id, 'failed')}
                          className="px-3 py-1.5 bg-rose-100 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-200"
                        >
                          &Eacute;chou&eacute; &#10007;
                        </button>
                      </>
                    )}
                    {stop.signature && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">Signature &#10003;</span>}
                    {stop.photo && <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">Photo &#10003;</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <DashboardLayout title="Suivi de Livraison">
      <AnimatePresence mode="wait">
        {loading ? renderLoading() : !selectedRoute ? renderList() : renderDetail()}
      </AnimatePresence>
    </DashboardLayout>
  );
};
