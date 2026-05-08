/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Filter, Printer, FileSpreadsheet, Calculator, X, User, Calendar, ChevronLeft, ChevronRight, Building2, Phone, MapPin, CreditCard, ArrowUpCircle, ArrowDownCircle, Wallet, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface ReleveItem {
  id: string;
  date: string;
  nDocument: string;
  type: string;
  libelle: string;
  debit: number;
  credit: number;
  solde: number;
}

interface ClientInfo {
  code: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  soldeInitial: number;
}

export const ReleveClient: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [clientList, setClientList] = useState<{ id: string; code: string; name: string }[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientInfo | null>(null);
  const [releveItems, setReleveItems] = useState<ReleveItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get('/api/clients', { headers: { Authorization: `Bearer ${token}` } });
        const data = res.data?.data || res.data || [];
        setClientList(data);
        if (data.length > 0) {
          fetchReleve(data[0].id);
        }
      } catch (err) {
        console.error("Erreur chargement clients:", err);
      }
    };
    fetchClients();
  }, [token]);

  const fetchReleve = async (clientId: string) => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/consultation/releve-client/${clientId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = res.data;
      if (data.client) {
        setSelectedClient(data.client);
      }
      setReleveItems(data.items || []);
    } catch (err) {
      console.error("Erreur chargement relevé client:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredReleve = releveItems.filter(item => {
    const matchesSearch = item.libelle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.nDocument.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalDebit = filteredReleve.reduce((sum, item) => sum + item.debit, 0);
  const totalCredit = filteredReleve.reduce((sum, item) => sum + item.credit, 0);
  const soldeFinal = selectedClient ? selectedClient.soldeInitial + totalDebit - totalCredit : 0;

  return (
    <DashboardLayout title="Relevé Client">
      <div className="h-full flex flex-col gap-4">
        {/* Client Selection & Filters */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <select
                  value={selectedClient?.code || ''}
                  onChange={(e) => { const c = clientList.find(c => c.code === e.target.value || c.id === e.target.value); if (c) fetchReleve(c.id); }}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64 appearance-none bg-white"
                >
                  {clientList.map(c => (
                    <option key={c.id} value={c.code || c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Filtrer opérations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-56"
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
                <X size={16} />
                Quitter
              </button>
            </div>
          </div>
        </div>

        {/* Client Info Card */}
        {selectedClient && (
          <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 rounded-xl p-5 text-white">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center">
                  <User size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold">{selectedClient.name}</h3>
                    <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium">{selectedClient.code}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-emerald-100">
                    <span className="flex items-center gap-1"><MapPin size={14} /> {selectedClient.address}, {selectedClient.city}</span>
                    <span className="flex items-center gap-1"><Phone size={14} /> {selectedClient.phone}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-emerald-100">Solde Actuel</p>
                <p className={`text-2xl font-bold ${soldeFinal >= 0 ? 'text-white' : 'text-red-300'}`}>
                  {soldeFinal.toFixed(2)} DH
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <Wallet className="text-gray-500" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Solde Initial</p>
                <p className="text-lg font-bold text-gray-700">{selectedClient?.soldeInitial.toFixed(2) || '0.00'} DH</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <ArrowUpCircle className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Total Débit</p>
                <p className="text-lg font-bold text-red-600">{totalDebit.toFixed(2)} DH</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <ArrowDownCircle className="text-emerald-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Total Crédit</p>
                <p className="text-lg font-bold text-emerald-600">{totalCredit.toFixed(2)} DH</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <CreditCard className="text-amber-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium">Solde Final</p>
                <p className={`text-lg font-bold ${soldeFinal >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                  {soldeFinal.toFixed(2)} DH
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Releve Table */}
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
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">N° Document</th>
                  <th className="px-3 py-3 text-center text-xs font-bold text-white border-r border-emerald-500">Type</th>
                  <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Libellé</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Débit</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Crédit</th>
                  <th className="px-3 py-3 text-right text-xs font-bold text-white">Solde</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Solde Initial Row */}
                <tr className="bg-gray-100 font-bold">
                  <td className="px-3 py-3 text-sm text-gray-500">-</td>
                  <td className="px-3 py-3 text-sm text-gray-500">-</td>
                  <td className="px-3 py-3 text-center">-</td>
                  <td className="px-3 py-3 text-sm text-gray-600">SOLDE INITIAL</td>
                  <td className="px-3 py-3 text-sm text-right">-</td>
                  <td className="px-3 py-3 text-sm text-right">-</td>
                  <td className="px-3 py-3 text-sm text-right font-bold text-gray-700">{selectedClient?.soldeInitial.toFixed(2) || '0.00'}</td>
                </tr>
                {filteredReleve.map((item, index) => (
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
                        item.type === 'FAC' ? 'bg-emerald-100 text-emerald-700' :
                        item.type === 'BL' ? 'bg-blue-100 text-blue-700' :
                        item.type === 'REG' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-600">{item.libelle}</td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-red-600">{item.debit > 0 ? item.debit.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 text-sm text-right font-medium text-emerald-600">{item.credit > 0 ? item.credit.toFixed(2) : '-'}</td>
                    <td className="px-3 py-3 text-sm text-right font-bold text-gray-700">{item.solde.toFixed(2)}</td>
                  </motion.tr>
                ))}
                {/* Solde Final Row */}
                <tr className="bg-emerald-50 font-bold border-t-2 border-emerald-200">
                  <td className="px-3 py-3 text-sm text-gray-500">-</td>
                  <td className="px-3 py-3 text-sm text-gray-500">-</td>
                  <td className="px-3 py-3 text-center">-</td>
                  <td className="px-3 py-3 text-sm text-emerald-800">SOLDE FINAL</td>
                  <td className="px-3 py-3 text-sm text-right text-red-600">{totalDebit.toFixed(2)}</td>
                  <td className="px-3 py-3 text-sm text-right text-emerald-600">{totalCredit.toFixed(2)}</td>
                  <td className={`px-3 py-3 text-sm text-right ${soldeFinal >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>{soldeFinal.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
            )}
          </div>
          
          {/* Footer */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Total: <span className="font-bold">{filteredReleve.length}</span> opérations
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
