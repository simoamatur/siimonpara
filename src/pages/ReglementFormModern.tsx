import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useToast } from '../contexts/ToastContext';
import {
  Save, X, Plus, Trash2, ArrowLeft, CheckCircle2, User, Hash, Calendar,
  CreditCard, DollarSign, ChevronDown, Search, FileText,
  CheckSquare, Wallet, ArrowRightLeft, Banknote, Receipt, AlertCircle
} from 'lucide-react';

interface InvoiceAllocation {
  id: string;
  factureId: string;
  factureNumber: string;
  factureDate: string;
  totalTTC: number;
  montantApplique: number;
}

interface ReglementForm {
  id: string;
  number: string;
  date: string;
  clientId: string;
  clientName: string;
  clientAddress?: string;
  modePaiementId: string;
  referenceChèque: string;
  montant: number;
  allocations: InvoiceAllocation[];
  notes: string;
  status: string;
  createdBy: string;
  createdAt: string;
}

interface ClientOption { id: string; code: string; name: string; }
interface ModePaiementOption { id: string; nom: string; }
interface FactureOption { id: string; reference: string; date: string; totalTTC: number; statut: string; }

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const configs: Record<string, { label: string; color: string }> = {
    draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-500 border-gray-200' },
    validated: { label: 'Validé', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
  };
  const config = configs[status] || configs.draft;
  return <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${config.color}`}>{config.label}</span>;
};

export const ReglementFormModern: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [modePaiements, setModePaiements] = useState<ModePaiementOption[]>([]);
  const [factures, setFactures] = useState<FactureOption[]>([]);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<ReglementForm>({
    id: '',
    number: 'REG-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 10000)).padStart(4, '0'),
    date: new Date().toISOString().split('T')[0],
    clientId: '',
    clientName: '',
    clientAddress: '',
    modePaiementId: '',
    referenceChèque: '',
    montant: 0,
    allocations: [],
    notes: '',
    status: 'draft',
    createdBy: 'Admin',
    createdAt: new Date().toISOString(),
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, modesRes, facturesRes] = await Promise.all([
          axios.get('/api/clients'),
          axios.get('/api/parametres/modes-reglement'),
          axios.get('/api/ventes/factures'),
        ]);
        const cData = clientsRes.data.data || clientsRes.data;
        const mData = modesRes.data.data || modesRes.data;
        const fData = facturesRes.data.data || facturesRes.data;
        setClients(Array.isArray(cData) ? cData : []);
        setModePaiements(Array.isArray(mData) ? mData : []);
        const facturesList = Array.isArray(fData) ? fData : [];
        setFactures(facturesList.filter((f: FactureOption) => f.statut === 'impayée' || f.statut === 'partielle'));
      } catch (err) {
        console.error('Erreur chargement formulaire', err);
      }
    };
    fetchData();
  }, []);

  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [showInvoiceSelector, setShowInvoiceSelector] = useState(false);

  const totals = useMemo(() => {
    const allocated = formData.allocations.reduce((sum, a) => sum + a.montantApplique, 0);
    return { allocated, unallocated: formData.montant - allocated };
  }, [formData.allocations, formData.montant]);

  const handleSelectClient = useCallback((client: ClientOption) => {
    setFormData(prev => ({ ...prev, clientId: client.id, clientName: client.name }));
    setShowClientDropdown(false);
    setClientSearch('');
  }, []);

  const handleAddAllocation = useCallback((facture: FactureOption) => {
    const remainingToAllocate = formData.montant - totals.allocated;
    if (remainingToAllocate <= 0) return;
    const newAlloc: InvoiceAllocation = {
      id: Date.now().toString(),
      factureId: facture.id,
      factureNumber: facture.reference,
      factureDate: facture.date,
      totalTTC: facture.totalTTC,
      montantApplique: Math.min(remainingToAllocate, facture.totalTTC),
    };
    setFormData(prev => ({ ...prev, allocations: [...prev.allocations, newAlloc] }));
    setShowInvoiceSelector(false);
  }, [formData.montant, totals.allocated]);

  const handleUpdateAllocation = useCallback((id: string, montant: number) => {
    setFormData(prev => ({
      ...prev,
      allocations: prev.allocations.map(a => a.id === id ? { ...a, montantApplique: montant } : a),
    }));
  }, []);

  const handleRemoveAllocation = useCallback((id: string) => {
    setFormData(prev => ({
      ...prev,
      allocations: prev.allocations.filter(a => a.id !== id),
    }));
  }, []);

  const handleAutoAllocate = useCallback(() => {
    let remaining = formData.montant;
    const newAllocs: InvoiceAllocation[] = [];
    const filteredFactures = factures.filter(
      f => !formData.allocations.find(a => a.factureId === f.id)
    );
    for (const f of filteredFactures) {
      if (remaining <= 0) break;
      const toAllocate = Math.min(remaining, f.totalTTC);
      newAllocs.push({
        id: Date.now().toString() + f.id,
        factureId: f.id,
        factureNumber: f.reference,
        factureDate: f.date,
        totalTTC: f.totalTTC,
        montantApplique: toAllocate,
      });
      remaining -= toAllocate;
    }
    setFormData(prev => ({ ...prev, allocations: [...prev.allocations, ...newAllocs] }));
  }, [formData.montant, formData.allocations, factures]);

  const handleSave = useCallback(async () => {
    if (!formData.clientId) { toast('error', "Veuillez sélectionner un client"); return; }
    if (!formData.montant || formData.montant <= 0) { toast('error', "Veuillez saisir un montant valide"); return; }
    setSaving(true);
    try {
      const payload = {
        clientId: formData.clientId,
        montant: formData.montant,
        modePaiementId: formData.modePaiementId || undefined,
        referenceChèque: formData.referenceChèque || undefined,
        items: formData.allocations.map(a => ({
          factureId: a.factureId,
          montantApplique: a.montantApplique,
        })),
      };
      await axios.post('/api/ventes/reglements', payload);
      navigate('/dashboard/vente/paiement');
    } catch (err: any) {
      toast('error', err.response?.data?.error || err.response?.data?.details || "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  }, [formData, navigate]);

  const filteredClients = useMemo(() => {
    if (!clientSearch) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()));
  }, [clientSearch, clients]);

  const availableFactures = useMemo(() => {
    const allocatedIds = new Set(formData.allocations.map(a => a.factureId));
    return factures.filter(f => !allocatedIds.has(f.id));
  }, [factures, formData.allocations]);

  return (
    <DashboardLayout title="Nouveau Règlement">
      <div className=" mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard/vente/paiement')} className="p-3 rounded-xl bg-white border border-gray-200 text-gray-500 hover:text-cyan-600 hover:border-cyan-300 transition-all">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-gray-700 flex items-center gap-2">
                <CreditCard size={28} className="text-cyan-600" /> Nouveau Règlement
              </h2>
              <p className="text-sm text-gray-400">Enregistrer un paiement client</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={formData.status} />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium shadow-lg shadow-cyan-500/25 disabled:opacity-50">
              <Save size={18} /> {saving ? '...' : 'Enregistrer'}
            </motion.button>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-cyan-50 to-white">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">N° Règlement</label>
                <input type="text" value={formData.number} readOnly className="w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg font-mono font-semibold" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Date</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-cyan-500/20" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase">Montant Total</label>
                <div className="relative">
                  <input type="number" step="0.01" value={formData.montant} onChange={(e) => setFormData(prev => ({ ...prev, montant: parseFloat(e.target.value) || 0 }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg font-bold text-cyan-600 text-lg" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">DH</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <User size={20} className="text-cyan-600" />
              <h3 className="font-bold text-gray-700">Client</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 relative">
                <label className="text-xs font-semibold text-gray-400">Client *</label>
                <div className="relative">
                  <input type="text" value={formData.clientName || formData.clientId} onClick={() => setShowClientDropdown(true)} readOnly placeholder="Sélectionner..." className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer" />
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </div>
                <AnimatePresence>
                  {showClientDropdown && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input type="text" autoFocus placeholder="Rechercher..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm" />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {filteredClients.map(c => (
                          <button key={c.id} onClick={() => handleSelectClient(c)} className="w-full px-4 py-3 text-left hover:bg-cyan-50 border-b last:border-0">
                            <p className="font-medium text-gray-700">{c.name}</p>
                            <p className="text-xs text-gray-400">{c.code}</p>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white">
            <div className="flex items-center gap-2 mb-4">
              <Wallet size={20} className="text-cyan-600" />
              <h3 className="font-bold text-gray-700">Mode de Paiement</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Mode</label>
                <select value={formData.modePaiementId} onChange={(e) => setFormData(prev => ({ ...prev, modePaiementId: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg">
                  <option value="">Sélectionner...</option>
                  {modePaiements.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400">Réf. Chèque</label>
                <input type="text" value={formData.referenceChèque} onChange={(e) => setFormData(prev => ({ ...prev, referenceChèque: e.target.value }))} className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg" placeholder="Ex: CH-001234" />
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-cyan-600" />
                <h3 className="font-bold text-gray-700">Affectation aux Factures</h3>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleAutoAllocate} className="px-3 py-1.5 bg-cyan-100 text-cyan-700 rounded-lg text-sm font-medium hover:bg-cyan-200">Auto-allocation</button>
                <button onClick={() => setShowInvoiceSelector(true)} className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg text-sm font-medium hover:bg-cyan-600">+ Ajouter facture</button>
              </div>
            </div>

            {showInvoiceSelector && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-600">Sélectionner une facture</h4>
                  <button onClick={() => setShowInvoiceSelector(false)} className="text-slate-400 hover:text-gray-500"><X size={18} /></button>
                </div>
                <div className="space-y-2">
                  {availableFactures.map(inv => (
                    <button key={inv.id} onClick={() => handleAddAllocation(inv)} className="w-full p-3 bg-white rounded-lg border border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/50 text-left">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-700">{inv.reference}</p>
                          <p className="text-xs text-gray-400">{inv.date} • Total: {inv.totalTTC.toFixed(2)} DH</p>
                        </div>
                        <span className="text-sm font-medium text-cyan-600">{inv.totalTTC.toFixed(2)} DH</span>
                      </div>
                    </button>
                  ))}
                  {availableFactures.length === 0 && <p className="text-sm text-gray-400 text-center py-2">Aucune facture disponible</p>}
                </div>
              </motion.div>
            )}

            {formData.allocations.length > 0 ? (
              <div className="space-y-2">
                {formData.allocations.map(allocation => (
                  <div key={allocation.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <FileText size={16} className="text-cyan-600" />
                        <span className="font-medium text-gray-700">{allocation.factureNumber}</span>
                      </div>
                      <div className="text-xs text-gray-400">Total: {allocation.totalTTC.toFixed(2)} DH</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="number" step="0.01" value={allocation.montantApplique} onChange={(e) => handleUpdateAllocation(allocation.id, parseFloat(e.target.value) || 0)} className="w-28 px-2 py-1 text-right border border-gray-200 rounded font-medium text-cyan-700" />
                      <span className="text-slate-400">DH</span>
                      <button onClick={() => handleRemoveAllocation(allocation.id)} className="p-1.5 text-rose-400 hover:bg-rose-50 rounded"><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                <Receipt size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-gray-400">Aucune affectation</p>
              </div>
            )}

            <div className="mt-6 bg-cyan-50 rounded-xl p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Montant Total</p>
                  <p className="text-xl font-bold text-gray-700">{formData.montant.toFixed(2)} DH</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Alloué</p>
                  <p className="text-xl font-bold text-emerald-600">{totals.allocated.toFixed(2)} DH</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase">Non-Alloué</p>
                  <p className={`text-xl font-bold ${totals.unallocated > 0 ? 'text-amber-600' : 'text-gray-500'}`}>{totals.unallocated.toFixed(2)} DH</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-semibold text-gray-600 mb-2 block">Notes</label>
              <textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} rows={3} placeholder="Observations..." className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none" />
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
};
