import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export const RetourDocuments: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/ventes/retours', { params: { page: 1, limit: 100 }, headers: { Authorization: `Bearer ${token}` } });
        const data = res.data?.data || res.data || [];
        const items = (Array.isArray(data) ? data : []).map((r: any) => ({
          id: r.id,
          document: 'RETOUR',
          bonNumber: r.reference || '',
          date: r.date?.split('T')[0] || '',
          code: r.client?.code || r.clientId || '',
          client: r.client?.name || '',
          mtHT: r.totalHT || 0,
          mtTTC: r.totalTTC || 0,
          entree: true,
          dateEntree: r.date?.split('T')[0] || '',
          livreur: '',
        }));
        setDocs(items.length ? items : []);
      } catch (err) { console.error('Erreur chargement retours documents:', err); } finally { setLoading(false); }
    };
    fetchData();
  }, [token]);

  const filtered = docs.filter((d) =>
    `${d.client} ${d.bonNumber}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Retour des Documents">
      <div className="h-full flex flex-col gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full" />
          </div>
        </div>
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-auto">
            {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div> : (
              <table className="w-full">
                <thead className="bg-emerald-600 sticky top-0">
                  <tr><th className="px-3 py-3 text-left text-xs font-bold text-white">N° Retour</th><th className="px-3 py-3 text-left text-xs font-bold text-white">Client</th><th className="px-3 py-3 text-right text-xs font-bold text-white">MT TTC</th><th className="px-3 py-3 text-center text-xs font-bold text-white">Date Retour</th><th className="px-3 py-3 text-center text-xs font-bold text-white">Statut</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Aucun retour trouvé</td></tr> :
                  filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm font-medium text-gray-700">{d.bonNumber}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{d.client}</td>
                      <td className="px-3 py-3 text-sm text-right font-medium text-gray-700">{d.mtTTC.toFixed(2)}</td>
                      <td className="px-3 py-3 text-sm text-center text-gray-500">{d.dateEntree}</td>
                      <td className="px-3 py-3 text-center">
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">Reçu</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">Total: {filtered.length} retour(s)</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
