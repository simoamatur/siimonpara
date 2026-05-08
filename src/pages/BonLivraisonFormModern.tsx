import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import {
  Save, X, Plus, Trash2, ArrowLeft, CheckCircle2, Building2, Hash,
  Calendar, Package, DollarSign, Search, ChevronDown, Printer, Copy,
  Calculator, Truck, AlertCircle, FileText, User, MapPin, Phone,
  Clock, Barcode, Camera, GripVertical, ScanLine, Percent, Check
} from 'lucide-react';

interface BonLine {
  id: string;
  lineNumber: number;
  depot: string;
  productId: string;
  code: string;
  designation: string;
  quantity: number;
  unit: string;
  puHT: number;
  remise: number;
  remise2: number;
  tva: number;
  puTTC: number;
  totalHT: number;
  totalTTC: number;
}

interface BonLivraisonForm {
  id: string;
  number: string;
  date: string;
  clientId: string;
  clientName: string;
  clientAddress?: string;
  clientPhone?: string;
  clientCity?: string;
  status: string;
  lines: BonLine[];
  observation?: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  totalRemise: number;
  paymentMode: string;
  livreur: string;
  commercial: string;
  createdBy: string;
  createdAt: string;
}

interface ClientOption { id: string; code: string; name: string; address?: string; phone?: string; city?: string; }
interface ProductOption { id: string; code: string; name: string; unit: string; sellPrice: number; tva?: { id: string; taux: number } }
interface LivreurOption { id: string; nom: string; }
interface DepotOption { id: string; nom: string; }

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: <Clock size={14} /> },
    validated: { label: 'Validé', color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <CheckCircle2 size={14} /> },
  };
  const config = configs[status] || configs.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.color}`}>
      {config.icon}
      {config.label}
    </span>
  );
};

export const BonLivraisonFormModern: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [livreurs, setLivreurs] = useState<LivreurOption[]>([]);
  const [depots, setDepots] = useState<DepotOption[]>([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<BonLivraisonForm>({
    id: '',
    number: `BL-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    status: 'draft',
    clientId: '',
    clientName: '',
    clientAddress: '',
    clientPhone: '',
    clientCity: '',
    lines: [],
    totalHT: 0,
    totalTVA: 0,
    totalTTC: 0,
    totalRemise: 0,
    paymentMode: 'ESPÈCE',
    livreur: '',
    commercial: 'Admin',
    createdBy: 'Admin',
    createdAt: new Date().toISOString(),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, productsRes, livreursRes, depotsRes] = await Promise.all([
          axios.get('/api/clients'),
          axios.get('/api/products'),
          axios.get('/api/parametres/livreurs'),
          axios.get('/api/parametres/depots'),
        ]);
        const cData = clientsRes.data.data || clientsRes.data;
        const pData = productsRes.data.data || productsRes.data;
        const lData = livreursRes.data.data || livreursRes.data;
        const dData = depotsRes.data.data || depotsRes.data;
        setClients(Array.isArray(cData) ? cData : []);
        setProducts(Array.isArray(pData) ? pData : []);
        setLivreurs(Array.isArray(lData) ? lData : []);
        setDepots(Array.isArray(dData) ? dData : []);
      } catch (err) {
        console.error('Erreur chargement formulaire', err);
      }
    };
    fetchData();
  }, []);

  const [showClientSearch, setShowClientSearch] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [showProductSearch, setShowProductSearch] = useState<number | null>(null);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const filteredClients = useMemo(() => {
    return clients.filter(c =>
      c.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(clientSearchTerm.toLowerCase())
    );
  }, [clientSearchTerm, clients]);

  const filteredProducts = useMemo(() => {
    return products.filter(p =>
      p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [productSearchTerm, products]);

  const calculateLineTotals = (line: Partial<BonLine>): BonLine => {
    const quantity = line.quantity || 0;
    const puHT = line.puHT || 0;
    const remise = line.remise || 0;
    const remise2 = line.remise2 || 0;
    const tva = line.tva || 0;
    const totalHT = quantity * puHT * (1 - remise / 100) * (1 - remise2 / 100);
    const totalTTC = totalHT * (1 + tva / 100);
    const puTTC = puHT * (1 + tva / 100);
    return { ...line as BonLine, totalHT, totalTTC, puTTC };
  };

  const recalculateTotals = (lines: BonLine[]) => {
    const totalHT = lines.reduce((sum, l) => sum + l.totalHT, 0);
    const totalTTC = lines.reduce((sum, l) => sum + l.totalTTC, 0);
    const totalTVA = totalTTC - totalHT;
    const totalRemise = lines.reduce((sum, l) => {
      const original = l.quantity * l.puHT;
      return sum + (original - l.totalHT);
    }, 0);
    return { totalHT, totalTVA, totalTTC, totalRemise };
  };

  const handleClientSelect = (client: ClientOption) => {
    setFormData(prev => ({
      ...prev,
      clientId: client.id,
      clientName: client.name,
      clientAddress: client.address || '',
      clientPhone: client.phone || '',
      clientCity: client.city || '',
    }));
    setShowClientSearch(false);
    setClientSearchTerm('');
  };

  const handleAddLine = () => {
    const depotNom = depots.length > 0 ? depots[0].nom : '';
    const newLine: BonLine = {
      id: `line-${Date.now()}`,
      lineNumber: (formData.lines?.length || 0) + 1,
      depot: depotNom,
      productId: '',
      code: '',
      designation: '',
      quantity: 1,
      unit: '',
      puHT: 0,
      remise: 0,
      remise2: 0,
      tva: 20,
      puTTC: 0,
      totalHT: 0,
      totalTTC: 0,
    };
    setFormData(prev => ({ ...prev, lines: [...(prev.lines || []), newLine] }));
    setShowProductSearch((formData.lines?.length || 0));
  };

  const handleProductSelect = (index: number, product: ProductOption) => {
    const line = formData.lines?.[index];
    if (!line) return;
    const tvaVal = product.tva?.taux ?? 20;
    const updatedLine = calculateLineTotals({
      ...line,
      productId: product.id,
      code: product.code,
      designation: product.name,
      unit: product.unit,
      puHT: product.sellPrice || 0,
      tva: tvaVal,
    });
    const newLines = [...(formData.lines || [])];
    newLines[index] = updatedLine;
    const totals = recalculateTotals(newLines);
    setFormData(prev => ({ ...prev, lines: newLines, ...totals }));
    setShowProductSearch(null);
    setProductSearchTerm('');
  };

  const handleLineChange = (index: number, field: keyof BonLine, value: any) => {
    const line = formData.lines?.[index];
    if (!line) return;
    const updatedLine = calculateLineTotals({ ...line, [field]: value });
    const newLines = [...(formData.lines || [])];
    newLines[index] = updatedLine;
    const totals = recalculateTotals(newLines);
    setFormData(prev => ({ ...prev, lines: newLines, ...totals }));
  };

  const handleRemoveLine = (index: number) => {
    const newLines = (formData.lines || []).filter((_, i) => i !== index);
    const renumberedLines = newLines.map((l, i) => ({ ...l, lineNumber: i + 1 }));
    const totals = recalculateTotals(renumberedLines);
    setFormData(prev => ({ ...prev, lines: renumberedLines, ...totals }));
  };

  const handleSave = async (validated: boolean = false) => {
    if (!formData.clientId) { toast('error', "Veuillez sélectionner un client"); return; }
    if (!formData.lines.length) { toast('error', "Veuillez ajouter au moins une ligne"); return; }
    setSaving(true);
    try {
      const payload = {
        clientId: formData.clientId,
        paymentMode: formData.paymentMode,
        validated,
        items: formData.lines.map(l => ({
          productId: l.productId,
          quantity: l.quantity,
          priceHT: l.puHT,
          discount: l.remise,
          tva: l.tva,
        })),
      };
      await axios.post('/api/bon-livraison', payload);
      navigate('/dashboard/vente/bon-livraison');
    } catch (err: any) {
      toast('error', err.response?.data?.error || err.response?.data?.details || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Nouveau Bon de Livraison">
      <div className=" mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/dashboard/vente/bon-livraison')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Retour à la liste</span>
          </button>
          <div className="flex items-center gap-3">
            <StatusBadge status={formData.status} />
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <Save size={18} />
              <span>{saving ? '...' : 'Brouillon'}</span>
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all disabled:opacity-50"
            >
              <CheckCircle2 size={18} />
              <span>{saving ? '...' : 'Valider'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Building2 size={18} className="text-emerald-500" />
                Client
              </h3>
              {formData.clientId ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-800">{formData.clientName}</p>
                    </div>
                    <button
                      onClick={() => setShowClientSearch(true)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-emerald-600 transition-colors"
                    >
                      <Search size={18} />
                    </button>
                  </div>
                  {formData.clientAddress && (
                    <p className="text-sm text-gray-600 flex items-center gap-1.5">
                      <MapPin size={14} className="text-gray-400" />
                      {formData.clientAddress}
                    </p>
                  )}
                  {formData.clientPhone && (
                    <p className="text-sm text-gray-600 flex items-center gap-1.5">
                      <Phone size={14} className="text-gray-400" />
                      {formData.clientPhone}
                    </p>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setShowClientSearch(true)}
                  className="w-full p-4 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all flex flex-col items-center gap-2 text-gray-500 hover:text-emerald-600"
                >
                  <Search size={24} />
                  <span>Sélectionner un client</span>
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Package size={18} className="text-emerald-500" />
                  Lignes de livraison
                </h3>
                <button
                  onClick={handleAddLine}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors text-sm font-medium"
                >
                  <Plus size={16} />
                  Ajouter
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">N°</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Dépôt</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Produit</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Qté</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">P.U. HT</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Rem%</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-600">Total HT</th>
                      <th className="px-3 py-2 text-center text-xs font-medium text-gray-600"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {formData.lines?.map((line, index) => (
                      <tr key={line.id} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2 text-sm text-gray-500">{line.lineNumber}</td>
                        <td className="px-3 py-2">
                          <select
                            value={line.depot}
                            onChange={(e) => handleLineChange(index, 'depot', e.target.value)}
                            className="text-sm border-0 bg-transparent focus:ring-0 text-gray-700"
                          >
                            {depots.map(d => <option key={d.id} value={d.nom}>{d.nom}</option>)}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          {line.code ? (
                            <div>
                              <p className="text-sm font-medium text-gray-700">{line.designation}</p>
                              <p className="text-xs text-gray-500">{line.code}</p>
                            </div>
                          ) : (
                            <button
                              onClick={() => setShowProductSearch(index)}
                              className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700"
                            >
                              <Search size={14} />
                              Sélectionner
                            </button>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={line.quantity}
                            onChange={(e) => handleLineChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                            className="w-16 text-right text-sm border border-gray-200 rounded px-2 py-1 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={line.puHT}
                            onChange={(e) => handleLineChange(index, 'puHT', parseFloat(e.target.value) || 0)}
                            className="w-20 text-right text-sm border border-gray-200 rounded px-2 py-1 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            value={line.remise}
                            onChange={(e) => handleLineChange(index, 'remise', parseFloat(e.target.value) || 0)}
                            className="w-14 text-right text-sm border border-gray-200 rounded px-2 py-1 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                          />
                        </td>
                        <td className="px-3 py-2 text-right text-sm font-medium text-gray-700">
                          {line.totalHT.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            onClick={() => handleRemoveLine(index)}
                            className="p-1 rounded hover:bg-rose-100 text-gray-400 hover:text-rose-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {formData.lines?.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-gray-400">
                          Aucune ligne. Cliquez sur "Ajouter" pour commencer.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Observations</h3>
              <textarea
                value={formData.observation || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, observation: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none resize-none"
                placeholder="Notes ou commentaires..."
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">Document</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Numéro</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    <Hash size={16} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{formData.number}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Mode de paiement</label>
                  <select
                    value={formData.paymentMode}
                    onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                  >
                    <option value="ESPÈCE">Espèces</option>
                    <option value="CHÈQUE">Chèque</option>
                    <option value="VIREMENT">Virement</option>
                    <option value="CRÉDIT">Crédit</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Livreur</label>
                  <select
                    value={formData.livreur || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, livreur: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm"
                  >
                    <option value="">Sélectionner...</option>
                    {livreurs.map(l => (
                      <option key={l.id} value={l.id}>{l.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Commercial</label>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                    <User size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-700">{formData.commercial}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/30">
              <h3 className="text-sm font-semibold mb-4 opacity-90">Totaux</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="opacity-80">Total HT</span>
                  <span className="font-semibold">{formData.totalHT?.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-80">TVA</span>
                  <span className="font-semibold">{formData.totalTVA?.toFixed(2)} DH</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="opacity-80">Remise</span>
                  <span className="font-semibold">{formData.totalRemise?.toFixed(2)} DH</span>
                </div>
                <div className="pt-3 border-t border-white/20 flex justify-between">
                  <span className="font-semibold">Total TTC</span>
                  <span className="text-xl font-bold">{formData.totalTTC?.toFixed(2)} DH</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showClientSearch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowClientSearch(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-4">Sélectionner un client</h3>
                <div className="relative mb-4">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={clientSearchTerm}
                    onChange={(e) => setClientSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    autoFocus
                  />
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredClients.map(client => (
                    <button
                      key={client.id}
                      onClick={() => handleClientSelect(client)}
                      className="w-full text-left p-3 rounded-xl hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100"
                    >
                      <p className="font-medium text-gray-800">{client.name}</p>
                      <p className="text-sm text-gray-500">{client.code}</p>
                    </button>
                  ))}
                  {filteredClients.length === 0 && (
                    <p className="text-center text-gray-400 py-4">Aucun client trouvé</p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showProductSearch !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowProductSearch(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6"
              >
                <h3 className="text-lg font-bold text-gray-800 mb-4">Sélectionner un produit</h3>
                <div className="relative mb-4">
                  <Barcode size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher par code ou désignation..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                    autoFocus
                  />
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredProducts.map(product => (
                    <button
                      key={product.id}
                      onClick={() => handleProductSelect(showProductSearch, product)}
                      className="w-full text-left p-3 rounded-xl hover:bg-emerald-50 transition-colors border border-transparent hover:border-emerald-100"
                    >
                      <p className="font-medium text-gray-800">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.code} • {product.unit} • {product.sellPrice} DH</p>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="text-center text-gray-400 py-4">Aucun produit trouvé</p>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
};

export default BonLivraisonFormModern;
