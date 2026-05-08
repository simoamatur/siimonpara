import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Loader2, User, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export const EtatLivraisonLivreur: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axios.get('/api/ventes/livraisons/routes', { params: { page: 1, limit: 100 }, headers: { Authorization: `Bearer ${token}` } });
        const routes = res.data?.data || res.data || [];
        const items = routes.flatMap((r: any) =>
          (r.affectations || []).map((a: any) => ({
            id: a.id,
            document: 'BL',
            bonNumber: a.bonLivraison?.reference || '',
            date: a.bonLivraison?.date?.split('T')[0] || '',
            code: a.bonLivraison?.client?.code || '',
            client: a.bonLivraison?.client?.name || '',
            mtHT: a.bonLivraison?.totalHT || 0,
            mtTTC: a.bonLivraison?.totalTTC || 0,
            dateLivraison: r.date?.split('T')[0] || '',
            livreur: r.livreur?.name || '',
          }))
        );
        setDocs(items.length ? items : []);
      } catch (err) { console.error('Erreur chargement état livraison livreur:', err); } finally { setLoading(false); }
    };
    fetchData();
  }, [token]);

  const filtered = docs.filter((d) =>
    `${d.client} ${d.bonNumber} ${d.livreur}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="État de Livraison par Livreur">
      <div className="h-full flex flex-col gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full" />
            </div>
          </div>
        </div>
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-auto">
            {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-emerald-600" size={40} /></div> : (
              <table className="w-full">
                <thead className="bg-emerald-600 sticky top-0">
                  <tr><th className="px-3 py-3 text-left text-xs font-bold text-white">N° BL</th><th className="px-3 py-3 text-left text-xs font-bold text-white">Client</th><th className="px-3 py-3 text-right text-xs font-bold text-white">MT TTC</th><th className="px-3 py-3 text-center text-xs font-bold text-white">Date Liv.</th><th className="px-3 py-3 text-center text-xs font-bold text-white"><User size={14} className="inline" /> Livreur</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? <tr><td colSpan={5} className="text-center py-10 text-gray-400 text-sm">Aucune livraison trouvée</td></tr> :
                  filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm font-medium text-gray-700">{d.bonNumber}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{d.client}</td>
                      <td className="px-3 py-3 text-sm text-right font-medium text-gray-700">{d.mtTTC.toFixed(2)}</td>
                      <td className="px-3 py-3 text-sm text-center text-gray-500">{d.dateLivraison}</td>
                      <td className="px-3 py-3 text-sm text-center font-medium text-gray-600">{d.livreur}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="text-sm text-gray-500">Total: {filtered.length} livraison(s)</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
