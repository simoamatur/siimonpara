/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Plus, Filter, Printer, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, X, FileText, FileSpreadsheet, ArrowRight, Calculator, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface BonReception {
  id: string;
  orderNumber: string;
  brFournisseur: string;
  date: string;
  code: string;
  fournisseur: string;
  utilisateur: string;
  mtRegle: number;
  montantTTC: number;
  valide: string;
  factureNumber: string;
}

export const BonsReception: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBR, setSelectedBR] = useState<string | null>(null);
  const [bonsReception, setBonsReception] = useState<BonReception[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/achat/receptions', { params: { limit: 200 } });
        const data = res.data?.data || res.data || [];
        setBonsReception(data.map((b: any) => ({
          id: b.id,
          orderNumber: b.reference || b.numero || '',
          brFournisseur: b.date ? new Date(b.date).toLocaleDateString('fr-FR') : '',
          date: b.date ? new Date(b.date).toLocaleDateString('fr-FR') : '',
          code: b.fournisseur?.code || '',
          fournisseur: b.fournisseur?.name || b.fournisseur?.raisonSociale || '',
          utilisateur: b.user?.name || '',
          mtRegle: 0,
          montantTTC: b.totalTTC || 0,
          valide: b.valide ? 'OUI' : '',
          factureNumber: '',
        })));
      } catch (err) {
        console.error('Erreur chargement bons réception:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredBR = bonsReception.filter(br => 
    br.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    br.fournisseur.toLowerCase().includes(searchQuery.toLowerCase()) ||
    br.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Liste des Bons de Réception">
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
                onClick={() => navigate('/dashboard/achat/reception/nouveau')}
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
                Interroger
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                <ArrowRight size={16} />
                N° Série
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                <FileSpreadsheet size={16} />
                Exporter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                <Calculator size={16} />
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
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">N° Ordre</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">N° BR Fournis.</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Code</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Fournisseur</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Utilisateur</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Mt Réglé</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Montant TTC</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-white border-r border-emerald-500">Validé</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white">N° Facture</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={10} className="text-center py-12"><Loader2 size={24} className="animate-spin mx-auto text-emerald-500" /></td></tr>
                ) : filteredBR.length === 0 ? (
                  <tr><td colSpan={10} className="text-center py-12 text-gray-400">Aucun bon de réception trouvé</td></tr>
                ) : filteredBR.map((br, index) => (
                  <motion.tr 
                    key={br.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedBR(br.id)}
                    className={`cursor-pointer transition-colors ${
                      selectedBR === br.id 
                        ? 'bg-emerald-50' 
                        : index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-emerald-50`}
                  >
                    <td className="px-3 py-3 text-sm font-medium text-gray-700">{br.orderNumber}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{br.brFournisseur}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{br.date}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{br.code}</td>
                    <td className="px-3 py-3 text-sm text-gray-700">{br.fournisseur}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{br.utilisateur}</td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-gray-700">{br.mtRegle.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-gray-700">{br.montantTTC.toFixed(2)}</td>
                    <td className="px-3 py-3 text-center text-sm text-gray-500">
                      {br.valide && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          {br.valide}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">{br.factureNumber}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Total: <span className="font-bold">{filteredBR.length}</span> bons de réception
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
