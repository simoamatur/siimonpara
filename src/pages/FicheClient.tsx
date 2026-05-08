import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/DashboardLayout';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Building2, Phone, Mail, MapPin, User, TrendingUp,
  CreditCard, Percent, CheckCircle2, XCircle, FileText, Truck,
  Receipt, Loader2, Calendar, DollarSign, Shield, Edit2
} from 'lucide-react';

interface Client {
  id: string; code: string; name: string; email?: string; phone?: string;
  address?: string; city?: string; villeId?: string; zoneId?: string;
  categorieId?: string; groupeRemiseId?: string;
  discountRate: number; creditPlafond: number; solde: number; isActif: boolean;
  ville?: { id: string; nom: string } | null;
  zone?: { id: string; nom: string } | null;
  categorie?: { id: string; nom: string } | null;
  groupeRemise?: { id: string; nom: string; taux?: number } | null;
  createdAt: string; updatedAt: string;
}

export const FicheClient: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
      try {
        const res = await axios.get(`/api/clients/${id}`);
        setClient(res.data);
      } catch {
        navigate('/dashboard/param/clients');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <DashboardLayout title="Fiche Client">
      <div className="flex items-center justify-center py-24"><Loader2 size={40} className="animate-spin text-emerald-500" /></div>
    </DashboardLayout>
  );

  if (!client) return null;

  return (
    <DashboardLayout title={`Fiche Client - ${client.name}`}>
      <div className="space-y-6">
        {/* Back button */}
        <button onClick={() => navigate('/dashboard/param/clients')} className="flex items-center gap-2 text-sm text-gray-400 hover:text-emerald-600 transition-colors">
          <ArrowLeft size={16} /> Retour à la liste
        </button>

        {/* Header Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-700 to-emerald-600 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center text-white text-2xl font-bold">{client.name.charAt(0)}</div>
                <div className="text-white">
                  <h1 className="text-2xl font-bold">{client.name}</h1>
                  <div className="flex items-center gap-3 mt-1 text-emerald-100 text-sm">
                    <span className="font-mono bg-white/10 px-2 py-0.5 rounded">{client.code}</span>
                    <span>Créé le {new Date(client.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${client.isActif ? 'bg-emerald-200 text-emerald-900' : 'bg-white/20 text-white'}`}>
                  {client.isActif ? 'Actif' : 'Inactif'}
                </span>
                <button onClick={() => navigate('/dashboard/param/clients')} className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm transition-colors">
                  <Edit2 size={14} /> Modifier
                </button>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50/50">
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-400 uppercase font-semibold">Solde</p>
                <DollarSign size={16} className={client.solde >= 0 ? 'text-emerald-500' : 'text-rose-500'} />
              </div>
              <p className={`text-xl font-bold ${client.solde >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {client.solde.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
              </p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-400 uppercase font-semibold">Plafond Crédit</p>
                <CreditCard size={16} className="text-blue-500" />
              </div>
              <p className="text-xl font-bold text-blue-600">{client.creditPlafond.toLocaleString('fr-FR')} DH</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-400 uppercase font-semibold">Remise</p>
                <Percent size={16} className="text-violet-500" />
              </div>
              <p className="text-xl font-bold text-violet-600">{client.discountRate}%</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-400 uppercase font-semibold">Crédit Disponible</p>
                <Shield size={16} className="text-cyan-500" />
              </div>
              <p className={`text-xl font-bold ${client.creditPlafond - client.solde >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {(client.creditPlafond - client.solde).toLocaleString('fr-FR')} DH
              </p>
            </div>
          </div>
        </motion.div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><User size={18} className="text-emerald-500" /> Informations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Phone size={16} className="text-emerald-500" />
                  <div><p className="text-xs text-gray-400">Téléphone</p><p className="text-sm font-medium text-gray-700">{client.phone || '-'}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Mail size={16} className="text-emerald-500" />
                  <div><p className="text-xs text-gray-400">Email</p><p className="text-sm font-medium text-gray-700">{client.email || '-'}</p></div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <MapPin size={16} className="text-emerald-500" />
                  <div><p className="text-xs text-gray-400">Adresse</p><p className="text-sm font-medium text-gray-700">{client.address || '-'}</p></div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Building2 size={16} className="text-emerald-500" />
                  <div><p className="text-xs text-gray-400">Ville</p><p className="text-sm font-medium text-gray-700">{client.ville?.nom || client.city || '-'}</p></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Classification */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-emerald-500" /> Classification</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Catégorie</span>
                <span className="text-sm font-semibold text-gray-700">{client.categorie?.nom || '-'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Zone</span>
                <span className="text-sm font-semibold text-gray-700">{client.zone?.nom || '-'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Groupe Remise</span>
                <span className="text-sm font-semibold text-gray-700">{client.groupeRemise?.nom || '-'}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-500">Taux Groupe</span>
                <span className="text-sm font-semibold text-gray-700">{client.groupeRemise?.taux ? `${client.groupeRemise.taux}%` : '-'}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Links */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-700 mb-4">Documents liés</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button onClick={() => navigate(`/dashboard/vente/factures?client=${client.id}`)} className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center text-white"><FileText size={20} /></div>
              <div><p className="font-semibold text-gray-700">Factures</p><p className="text-xs text-gray-400">Voir les factures</p></div>
            </button>
            <button onClick={() => navigate(`/dashboard/vente/bon-livraison?client=${client.id}`)} className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white"><Truck size={20} /></div>
              <div><p className="font-semibold text-gray-700">BL</p><p className="text-xs text-gray-400">Bons de livraison</p></div>
            </button>
            <button onClick={() => navigate(`/dashboard/vente/reglements?client=${client.id}`)} className="flex items-center gap-3 p-4 bg-violet-50 rounded-xl hover:bg-violet-100 transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-violet-500 flex items-center justify-center text-white"><Receipt size={20} /></div>
              <div><p className="font-semibold text-gray-700">Règlements</p><p className="text-xs text-gray-400">Paiements reçus</p></div>
            </button>
            <button onClick={() => navigate(`/dashboard/consultation/releve-client/${client.id}`)} className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors text-left">
              <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white"><Calendar size={20} /></div>
              <div><p className="font-semibold text-gray-700">Relevé</p><p className="text-xs text-gray-400">Relevé de compte</p></div>
            </button>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};
