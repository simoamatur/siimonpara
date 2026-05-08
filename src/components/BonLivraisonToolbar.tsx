/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Plus, 
  Edit3, 
  Search, 
  Download, 
  Printer, 
  FileCheck, 
  LogOut,
  ChevronDown
} from 'lucide-react';

interface ToolbarProps {
  onAdd: () => void;
  onEdit: () => void;
  onExport: () => void;
  onPrint: () => void;
  onInvoice: () => void;
}

export const BonLivraisonToolbar: React.FC<ToolbarProps> = ({ 
  onAdd, 
  onEdit, 
  onExport, 
  onPrint, 
  onInvoice 
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex flex-wrap items-center gap-1.5">
        <button 
          onClick={onAdd}
          className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-700/20"
        >
          <Plus size={16} />
          Ajouter
        </button>
        <button 
          onClick={onEdit}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 px-4 py-2 rounded-lg text-xs font-bold transition-all"
        >
          <Edit3 size={16} className="text-blue-500" />
          Modifier
        </button>
        <div className="w-[1px] h-6 bg-slate-200 mx-2" />
        <button 
          onClick={onPrint}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold transition-all"
        >
          <Printer size={16} className="text-slate-400" />
          Imprimer
        </button>
        <button 
          onClick={onExport}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold transition-all"
        >
          <Download size={16} className="text-slate-400" />
          Exporter
        </button>
        <button 
          onClick={onInvoice}
          className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold transition-all"
        >
          <FileCheck size={16} className="text-emerald-500" />
          Facturer
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input 
            type="text" 
            placeholder="Rechercher par client..." 
            className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-emerald-500 w-64"
          />
        </div>
        <button className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-white border border-gray-200 px-3 py-2 rounded-lg hover:bg-gray-50">
          Totaux <ChevronDown size={14} />
        </button>
        <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
          <LogOut size={18} />
        </button>
      </div>
    </div>
  );
};
