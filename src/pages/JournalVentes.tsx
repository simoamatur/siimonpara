/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Filter, Printer, FileSpreadsheet, Calculator, X, ShoppingCart, Calendar, ChevronLeft, ChevronRight, Eye, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface JournalVenteItem {
  id: string;
  date: string;
  nDocument: string;
  type: string;
  codeClient: string;
  client: string;
  codeArticle: string;
  article: string;
  qte: number;
  puht: number;
  montantHT: number;
  tva: number;
  montantTTC: number;
  depot: string;
  vendeur: string;
}

export const JournalVentes: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [journalVentes, setJournalVentes] = useState<JournalVenteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params: any = {};
        if (dateDebut) params.dateDebut = dateDebut;
        if (dateFin) params.dateFin = dateFin;
        if (selectedType) params.type = selectedType;
        const res = await axios.get('/api/consultation/journal-ventes', { params, headers: { Authorization: `Bearer ${token}` } });
        setJournalVentes(res.data || []);
      } catch (err) {
        console.error("Erreur chargement journal ventes:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateDebut, dateFin, selectedType, token]);

  const filteredVentes = journalVentes.filter(item => {
    const matchesSearch = item.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.nDocument.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.article.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = !selectedType || item.type === selectedType;
    return matchesSearch && matchesType;
  });

  const totalHT = filteredVentes.reduce((sum, item) => sum + item.montantHT, 0);
  const totalTVA = filteredVentes.reduce((sum, item) => sum + item.tva, 0);
  const totalTTC = filteredVentes.reduce((sum, item) => sum + item.montantTTC, 0);

  return (
    <DashboardLayout title="Journal des Ventes">
      <div className="h-full flex flex-col gap-4">
        {/* Filters Toolbar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
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
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <input
                  type="date"
                  value={dateDebut}
                  onChange={(e) => setDateDebut(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-slate-400">à</span>
                <input
                  type="date"
                  value={dateFin}
                  onChange={(e) => setDateFin(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Tous les types</option>
                <option value="BL">Bon de Livraison</option>
                <option value="FAC">Facture</option>
                <option value="AV">Avoir</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-bold">
                <Printer size={16} />
                Imprimer
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                <FileSpreadsheet size={16} />
                Exporter
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                <Eye size={16} />
                Détails
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50">
                <X size={16} />
                Quitter
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <ShoppingCart className="text-emerald-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Total HT</p>
                <p className="text-lg font-bold text-gray-700">{totalHT.toFixed(2)} DH</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calculator className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Total TVA</p>
                <p className="text-lg font-bold text-gray-700">{totalTVA.toFixed(2)} DH</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-amber-600 font-bold text-sm">TTC</span>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Total TTC</p>
                <p className="text-lg font-bold text-emerald-700">{totalTTC.toFixed(2)} DH</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold text-sm">N°</span>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Nb Lignes</p>
                <p className="text-lg font-bold text-gray-700">{filteredVentes.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-emerald-600" size={40} />
              </div>
            ) : (
            <table className="w-full">
              <thead className="bg-emerald-600 sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">N° Doc</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-white border-r border-emerald-500">Type</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Client</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Article</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Qté</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">P.U. HT</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Montant HT</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">TVA</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Montant TTC</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-white">Vendeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVentes.map((item, index) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-3 py-3 text-sm text-gray-500">{item.date}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-700">{item.nDocument}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                        item.type === 'BL' ? 'bg-blue-100 text-blue-700' :
                        item.type === 'FAC' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{item.client}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{item.article}</td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-gray-700">{item.qte}</td>
                    <td className="px-3 py-3 text-sm text-right text-gray-500">{item.puht.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-gray-700">{item.montantHT.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right text-gray-500">{item.tva.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right font-bold text-emerald-700">{item.montantTTC.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-center text-gray-500">{item.vendeur}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Total: <span className="font-bold">{filteredVentes.length}</span> lignes | 
              HT: <span className="font-bold">{totalHT.toFixed(2)} DH</span> | 
              TVA: <span className="font-bold">{totalTVA.toFixed(2)} DH</span> | 
              TTC: <span className="font-bold text-emerald-700">{totalTTC.toFixed(2)} DH</span>
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
