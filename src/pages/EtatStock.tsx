/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Filter, Printer, FileSpreadsheet, Calculator, X, Package, Warehouse, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface EtatStockItem {
  id: string;
  codeArticle: string;
  libelle: string;
  famille: string;
  sousFamille: string;
  unite: string;
  stockInitial: number;
  entrees: number;
  sorties: number;
  stockTheorique: number;
  stockPhysique: number;
  ecart: number;
  puht: number;
  valeurStock: number;
  depot: string;
}

export const EtatStock: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepot, setSelectedDepot] = useState('');
  const [selectedFamille, setSelectedFamille] = useState('');
  const [etatStock, setEtatStock] = useState<EtatStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const params: any = {};
        if (selectedDepot) params.depot = selectedDepot;
        if (selectedFamille) params.famille = selectedFamille;
        const res = await axios.get('/api/consultation/etat-stock', { params, headers: { Authorization: `Bearer ${token}` } });
        setEtatStock(res.data || []);
      } catch (err) {
        console.error("Erreur chargement état stock:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDepot, selectedFamille, token]);

  const filteredStock = etatStock.filter(item => {
    const matchesSearch = item.codeArticle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.libelle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepot = !selectedDepot || item.depot === selectedDepot;
    const matchesFamille = !selectedFamille || item.famille === selectedFamille;
    return matchesSearch && matchesDepot && matchesFamille;
  });

  const totalValeur = filteredStock.reduce((sum, item) => sum + item.valeurStock, 0);
  const totalArticles = filteredStock.length;

  return (
    <DashboardLayout title="État de Stock">
      <div className="h-full flex flex-col gap-4">
        {/* Filters Toolbar */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher article..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
                />
              </div>
              <select
                value={selectedDepot}
                onChange={(e) => setSelectedDepot(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Tous les dépôts</option>
                <option value="DEP01">Dépôt Principal</option>
                <option value="DEP02">Dépôt Secondaire</option>
              </select>
              <select
                value={selectedFamille}
                onChange={(e) => setSelectedFamille(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Toutes les familles</option>
                <option value="Médicaments">Médicaments</option>
                <option value="Cosmétique">Cosmétique</option>
                <option value="Dermato">Dermato</option>
                <option value="Compléments">Compléments</option>
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

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Package className="text-emerald-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Total Articles</p>
                <p className="text-lg font-bold text-gray-700">{totalArticles}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Warehouse className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Valeur Stock</p>
                <p className="text-lg font-bold text-gray-700">{totalValeur.toFixed(2)} DH</p>
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
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Code Article</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Libellé</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Famille</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-white border-r border-emerald-500">Unité</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Stock Init.</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Entrées</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Sorties</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Stock Théo.</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Stock Phys.</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Écart</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">P.U. HT</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white">Valeur Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStock.map((item, index) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="px-3 py-3 text-sm font-medium text-gray-700">{item.codeArticle}</td>
                    <td className="px-3 py-3 text-sm text-gray-600">{item.libelle}</td>
                    <td className="px-3 py-3 text-sm text-gray-500">{item.famille}</td>
                    <td className="px-3 py-3 text-sm text-center text-gray-500">{item.unite}</td>
                    <td className="px-3 py-3 text-sm text-right text-gray-500">{item.stockInitial}</td>
                    <td className="px-3 py-3 text-sm text-right text-emerald-600 font-medium">+{item.entrees}</td>
                    <td className="px-3 py-3 text-sm text-right text-red-500 font-medium">-{item.sorties}</td>
                    <td className="px-3 py-3 text-sm text-right font-bold text-gray-700">{item.stockTheorique}</td>
                    <td className="px-3 py-3 text-sm text-right font-bold text-gray-700">{item.stockPhysique}</td>
                    <td className={`px-3 py-3 text-sm text-right font-bold ${item.ecart !== 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {item.ecart > 0 ? '+' : ''}{item.ecart}
                    </td>
                    <td className="px-3 py-3 text-sm text-right text-gray-500">{item.puht.toFixed(2)}</td>
                    <td className="px-3 py-3 text-sm text-right font-bold text-emerald-700">{item.valeurStock.toFixed(2)}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Total: <span className="font-bold">{filteredStock.length}</span> articles | 
              Valeur totale: <span className="font-bold text-emerald-700">{totalValeur.toFixed(2)} DH</span>
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
