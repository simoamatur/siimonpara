import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

export const AffectationDocuments: React.FC = () => {
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
            zone: '',
            mtHT: a.bonLivraison?.totalHT || 0,
            mtTTC: a.bonLivraison?.totalTTC || 0,
            livre: a.statut === 'livré',
            dateLiv: '',
            livreur: r.livreur?.name || '',
          }))
        );
        setDocs(items.length ? items : []);
      } catch (err) { console.error('Erreur chargement affectation documents:', err); } finally { setLoading(false); }
    };
    fetchData();
  }, [token]);

  const filtered = docs.filter((d) =>
    `${d.client} ${d.bonNumber} ${d.code}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout title="Affectation des Documents">
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
                  <tr><th className="px-3 py-3 text-left text-xs font-bold text-white">Doc</th><th className="px-3 py-3 text-left text-xs font-bold text-white">N°</th><th className="px-3 py-3 text-left text-xs font-bold text-white">Client</th><th className="px-3 py-3 text-right text-xs font-bold text-white">MT TTC</th><th className="px-3 py-3 text-center text-xs font-bold text-white">Livreur</th><th className="px-3 py-3 text-center text-xs font-bold text-white">Statut</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.length === 0 ? <tr><td colSpan={6} className="text-center py-10 text-gray-400 text-sm">Aucune affectation trouvée</td></tr> :
                  filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-sm font-bold text-gray-700">{d.document}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{d.bonNumber}</td>
                      <td className="px-3 py-3 text-sm text-gray-600">{d.client}</td>
                      <td className="px-3 py-3 text-sm text-right font-medium text-gray-700">{d.mtTTC.toFixed(2)}</td>
                      <td className="px-3 py-3 text-sm text-center text-gray-500">{d.livreur}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${d.livre ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {d.livre ? 'Livré' : 'En attente'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-500">Total: {filtered.length} document(s)</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
