import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Plus, Filter, Printer, FileSpreadsheet, Edit2, Trash2, X, Layers, ChevronLeft, ChevronRight, Save, ArrowLeft, PlusCircle, MinusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

interface NomenclatureItem {
  id: string;
  codeEnfant: string;
  libelleEnfant: string;
  unite: string;
  qte: number;
  puht: number;
  montant: number;
}

interface Nomenclature {
  id: string;
  code: string;
  libelle: string;
  famille: string;
  unite: string;
  coutTotal: number;
  items: NomenclatureItem[];
}

export const ArticlesNomenclature: React.FC = () => {
  const toast = useToast();
  const confirm = useConfirm();
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Nomenclature | null>(null);
  const [nomenclatures, setNomenclatures] = useState<Nomenclature[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Nomenclature>>({
    code: '',
    libelle: '',
    famille: '',
    unite: 'U',
  });

  const [nomenclatureItems, setNomenclatureItems] = useState<NomenclatureItem[]>([]);

  const fetchNomenclatures = async () => {
    try {
      const res = await axios.get('/api/parametres/nomenclatures');
      setNomenclatures(res.data?.data || res.data);
    } catch { toast('error', 'Erreur chargement nomenclatures'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchNomenclatures(); }, []);

  const filteredArticles = nomenclatures.filter(a =>
    a.libelle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedArticle(null);
    setFormData({ code: '', libelle: '', famille: '', unite: 'U' });
    setNomenclatureItems([]);
    setShowForm(true);
  };

  const handleEdit = (article: Nomenclature) => {
    setSelectedArticle(article);
    setFormData({ code: article.code, libelle: article.libelle, famille: article.famille, unite: article.unite });
    setNomenclatureItems(article.items.map(item => ({ ...item })));
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.libelle) {
      toast('error', 'Code et libellé sont requis');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        code: formData.code,
        libelle: formData.libelle,
        famille: formData.famille || undefined,
        unite: formData.unite || 'U',
        items: nomenclatureItems.map(({ id, ...item }) => ({
          ...item,
          montant: item.qte * item.puht,
        })),
      };
      if (selectedArticle) {
        await axios.put(`/api/parametres/nomenclatures/${selectedArticle.id}`, payload);
        toast('success', 'Nomenclature modifiée avec succès');
      } else {
        await axios.post('/api/parametres/nomenclatures', payload);
        toast('success', 'Nomenclature créée avec succès');
      }
      setShowForm(false);
      fetchNomenclatures();
    } catch (e: any) {
      toast('error', e.response?.data?.details || e.response?.data?.error || "Erreur lors de l'enregistrement");
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: 'Supprimer cette nomenclature ?'}))) return;
    try {
      await axios.delete(`/api/parametres/nomenclatures/${id}`);
      toast('success', 'Nomenclature supprimée');
      fetchNomenclatures();
    } catch { toast('error', 'Erreur suppression'); }
  };

  const addNomenclatureItem = () => {
    const newItem: NomenclatureItem = {
      id: Date.now().toString(),
      codeEnfant: '',
      libelleEnfant: '',
      unite: 'U',
      qte: 1,
      puht: 0,
      montant: 0,
    };
    setNomenclatureItems([...nomenclatureItems, newItem]);
  };

  const updateNomenclatureItem = (id: string, field: keyof NomenclatureItem, value: any) => {
    setNomenclatureItems(nomenclatureItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'qte' || field === 'puht') {
          updated.montant = updated.qte * updated.puht;
        }
        return updated;
      }
      return item;
    }));
  };

  const deleteNomenclatureItem = (id: string) => {
    setNomenclatureItems(nomenclatureItems.filter(item => item.id !== id));
  };

  const totalCout = nomenclatureItems.reduce((sum, item) => sum + item.montant, 0);

  return (
    <DashboardLayout title="Articles & Nomenclature">
      <div className="h-full flex flex-col gap-4">
        {!showForm ? (
          <>
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" placeholder="Rechercher nomenclature..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64" />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50"><Filter size={16} /> Filtrer</button>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"><Plus size={18} /><span className="font-bold text-sm">Ajouter</span></button>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50"><Printer size={16} /> Imprimer</button>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50"><FileSpreadsheet size={16} /> Exporter</button>
                </div>
              </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
              <div className="overflow-auto flex-1">
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-emerald-600 sticky top-0">
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Code</th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Libellé</th>
                        <th className="px-3 py-3 text-left text-xs font-bold text-white border-r border-emerald-500">Famille</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-white border-r border-emerald-500">Unité</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-white border-r border-emerald-500">Nb Articles</th>
                        <th className="px-3 py-3 text-right text-xs font-bold text-white border-r border-emerald-500">Coût Total</th>
                        <th className="px-3 py-3 text-center text-xs font-bold text-white">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredArticles.map((a, index) => (
                        <motion.tr key={a.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-3 text-sm font-medium text-gray-700">{a.code}</td>
                          <td className="px-3 py-3 text-sm text-gray-700">{a.libelle}</td>
                          <td className="px-3 py-3 text-sm text-gray-500">{a.famille}</td>
                          <td className="px-3 py-3 text-sm text-center text-gray-500">{a.unite}</td>
                          <td className="px-3 py-3 text-sm text-center text-gray-500">{a.items?.length || 0}</td>
                          <td className="px-3 py-3 text-sm text-right font-bold text-emerald-700">{a.coutTotal.toFixed(2)}</td>
                          <td className="px-3 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button onClick={() => handleEdit(a)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button>
                              <button onClick={() => handleDelete(a.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="text-sm text-gray-500">Total: <span className="font-bold">{filteredArticles.length}</span> nomenclatures</div>
                <div className="flex items-center gap-2">
                  <button className="p-1 rounded hover:bg-slate-200 text-gray-500"><ChevronLeft size={18} /></button>
                  <span className="text-sm text-gray-500">Page 1 / 1</span>
                  <button className="p-1 rounded hover:bg-slate-200 text-gray-500"><ChevronRight size={18} /></button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Layers size={24} />
                  <div>
                    <h2 className="text-lg font-bold">{selectedArticle ? 'Modifier Nomenclature' : 'Nouvelle Nomenclature'}</h2>
                    <p className="text-emerald-100 text-sm">{selectedArticle ? `Code: ${selectedArticle.code}` : 'Création d\'une nomenclature'}</p>
                  </div>
                </div>
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"><ArrowLeft size={18} /> Retour</button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-auto">
              <div className="grid grid-cols-4 gap-6 mb-6">
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Code Nomenclature:</label><input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="NOM00X" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Libellé:</label><input type="text" value={formData.libelle} onChange={(e) => setFormData({ ...formData, libelle: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Nom de la nomenclature" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Famille:</label><select value={formData.famille} onChange={(e) => setFormData({ ...formData, famille: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="">Sélectionner...</option><option value="Kits">Kits</option><option value="Packs">Packs</option><option value="Ensembles">Ensembles</option></select></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Unité:</label><input type="text" value={formData.unite} onChange={(e) => setFormData({ ...formData, unite: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden mb-6">
                <div className="bg-emerald-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2"><Layers size={16} /> Composition</h3>
                  <button onClick={addNomenclatureItem} className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-bold"><PlusCircle size={16} /> Ajouter Article</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100"><tr><th className="px-3 py-2 text-left text-xs font-bold text-gray-600">Code Article</th><th className="px-3 py-2 text-left text-xs font-bold text-gray-600">Libellé</th><th className="px-3 py-2 text-center text-xs font-bold text-gray-600">Unité</th><th className="px-3 py-2 text-right text-xs font-bold text-gray-600">Qté</th><th className="px-3 py-2 text-right text-xs font-bold text-gray-600">P.U. HT</th><th className="px-3 py-2 text-right text-xs font-bold text-gray-600">Montant</th><th className="px-3 py-2 text-center text-xs font-bold text-gray-600 w-12">Action</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {nomenclatureItems.map((item, idx) => (
                        <tr key={item.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2"><input type="text" value={item.codeEnfant} onChange={(e) => updateNomenclatureItem(item.id, 'codeEnfant', e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-sm" placeholder="PR00X" /></td>
                          <td className="px-3 py-2"><input type="text" value={item.libelleEnfant} onChange={(e) => updateNomenclatureItem(item.id, 'libelleEnfant', e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-sm" /></td>
                          <td className="px-3 py-2"><input type="text" value={item.unite} onChange={(e) => updateNomenclatureItem(item.id, 'unite', e.target.value)} className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-center" /></td>
                          <td className="px-3 py-2"><input type="number" value={item.qte} onChange={(e) => updateNomenclatureItem(item.id, 'qte', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-right" /></td>
                          <td className="px-3 py-2"><input type="number" step="0.01" value={item.puht} onChange={(e) => updateNomenclatureItem(item.id, 'puht', parseFloat(e.target.value) || 0)} className="w-full px-2 py-1 border border-slate-300 rounded text-sm text-right" /></td>
                          <td className="px-3 py-2"><input type="number" value={item.montant.toFixed(2)} readOnly className="w-full px-2 py-1 bg-gray-100 border border-slate-300 rounded text-sm text-right font-medium" /></td>
                          <td className="px-3 py-2 text-center"><button onClick={() => deleteNomenclatureItem(item.id)} className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"><MinusCircle size={16} /></button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-3 border-t border-gray-200 bg-gray-100 flex items-center justify-end">
                  <div className="text-sm"><span className="text-gray-500">Coût Total Nomenclature:</span> <span className="font-bold text-emerald-700 ml-2 text-lg">{totalCout.toFixed(2)} DH</span></div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-6 border-t border-gray-200">
                <button onClick={handleSave} disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold disabled:opacity-50"><Save size={18} /> {submitting ? 'Enregistrement...' : 'Enregistrer'}</button>
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 px-6 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-bold"><X size={18} /> Annuler</button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};
