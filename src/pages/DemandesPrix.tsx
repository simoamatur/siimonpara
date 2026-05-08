/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Plus, Filter, Printer, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, X, FileText, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface DemandePrix {
  id: string;
  demandeNumber: string;
  date: string;
  utilisateur: string;
  total: number;
}

export const DemandesPrix: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDemande, setSelectedDemande] = useState<string | null>(null);
  const [demandes, setDemandes] = useState<DemandePrix[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/achat/demandes', { params: { limit: 200 } });
        const data = res.data?.data || res.data || [];
        setDemandes(data.map((d: any) => ({
          id: d.id,
          demandeNumber: d.reference || d.numero || '',
          date: d.date ? new Date(d.date).toLocaleDateString('fr-FR') : '',
          utilisateur: d.fournisseur?.name || d.user?.name || '',
          total: d.totalTTC || d.total || 0,
        })));
      } catch (err) {
        console.error('Erreur chargement demandes prix:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDemandes = demandes.filter(dem => 
    dem.demandeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dem.utilisateur.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Liste des Demandes de Prix">
      <div className="h-full flex flex-col gap-4">
        {/* Toolbar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                <Filter size={16} />
                Filtrer
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate('/dashboard/achat/demande-prix/nouveau')}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus size={18} />
                <span className="font-bold text-sm">Ajouter</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                <Edit2 size={16} />
                Modifier
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                <Trash2 size={16} />
                Supprimer
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                <Eye size={16} />
                Aperçu
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                <Printer size={16} />
                Imprimer
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                <FileText size={16} />
                Totaux
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                <X size={16} />
                Quitter
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full">
              <thead className="bg-emerald-600 sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">N° Demande</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Utilisateur</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-emerald-500" /></td></tr>
                ) : filteredDemandes.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-12 text-gray-400">Aucune demande trouvée</td></tr>
                ) : filteredDemandes.map((dem, index) => (
                  <motion.tr 
                    key={dem.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedDemande(dem.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedDemande === dem.id 
                        ? 'bg-emerald-50' 
                        : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-emerald-50`}
                  >
                    <td className="px-3 py-3 text-sm font-medium text-gray-700">{dem.demandeNumber}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{dem.date}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{dem.utilisateur}</td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-gray-700">{dem.total.toFixed(2)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Total: <span className="font-bold">{filteredDemandes.length}</span> demandes
            </div>
            <div className="flex items-center gap-2">
              <button className="p-1 rounded hover:bg-slate-200 text-gray-500">
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm text-gray-500">Page 1 / 1</span>
              <button className="p-1 rounded hover:bg-slate-200 text-gray-500">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
