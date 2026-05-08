/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, Circle, Printer, ListFilter, FileText, ClipboardList, Search } from 'lucide-react';
import { BonLivraison } from '../types';

interface TableProps {
  data: BonLivraison[];
  onSelect: (id: string, mode: 'view' | 'edit') => void;
}

export const BonLivraisonTable: React.FC<TableProps> = ({ data, onSelect }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = Array.isArray(data) ? data.filter((bl) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      bl.reference?.toLowerCase().includes(searchLower) ||
      bl.client?.name?.toLowerCase().includes(searchLower)
    );
  }) : [];

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Table Header / Search Bar */}
      <div className="p-4 bg-gray-50/50 border-b border-gray-200 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Rechercher par N° BL ou Client..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {filteredData.length} résultat(s)
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Date de saisie</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">N° BL</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Client</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Montant TTC</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">Validé</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400 text-center">Impressions</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Utilisateur</th>
              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredData.map((bl) => (
              <tr 
                key={bl.id} 
                className="hover:bg-emerald-50 transition-colors cursor-pointer group"
                onClick={() => onSelect(bl.id, 'view')}
              >
                <td className="px-4 py-3 text-xs text-gray-500">
                  {format(new Date(bl.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </td>
                <td className="px-4 py-3 text-xs font-bold text-emerald-800">{bl.reference}</td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex flex-col">
                    <span className="font-bold text-gray-600">{bl.client?.name}</span>
                    <span className="text-[10px] text-slate-400">{bl.client?.code}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs font-black text-gray-700 border-r border-slate-50">
                  {bl.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} DH
                </td>
                <td className="px-4 py-3 text-center">
                  {bl.validated ? (
                    <CheckCircle2 size={16} className="text-emerald-500 mx-auto" />
                  ) : (
                    <Circle size={16} className="text-slate-300 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <Printer size={12} className={bl.printedCount > 0 ? "text-blue-500" : "text-slate-300"} />
                    <span className="text-[10px] font-bold text-gray-400">{bl.printedCount}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[10px] uppercase font-bold text-slate-400">
                  {bl.user?.name}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onSelect(bl.id, 'edit'); }}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded border border-transparent hover:border-blue-100 shadow-sm transition-all"
                    >
                      <ListFilter size={14} />
                    </button>
                    <button 
                      className="p-1.5 text-slate-400 hover:text-emerald-700 hover:bg-white rounded border border-transparent hover:border-emerald-100 shadow-sm transition-all"
                    >
                      <FileText size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {data.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center gap-4 border-t border-gray-100">
            <ClipboardList size={48} strokeWidth={1} className="text-slate-200" />
            <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Aucun Bon de Livraison trouvé</p>
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 p-4 border-t border-gray-200 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Affichage de {data.length} éléments</span>
        <div className="flex gap-2">
          <button className="px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold disabled:opacity-50" disabled>Précèdent</button>
          <button className="px-3 py-1 bg-white border border-gray-200 rounded text-[10px] font-bold">Suivant</button>
        </div>
      </div>
    </div>
  );
};
