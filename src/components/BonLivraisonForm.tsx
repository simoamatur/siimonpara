/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Plus, Trash2, Check, X, Search, Calculator, ClipboardList } from 'lucide-react';
import { Client, Product, BonLivraison } from '../types';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const itemSchema = z.object({
  productId: z.string().min(1, "Produit requis"),
  code: z.string(),
  name: z.string(),
  consign: z.string().optional(),
  bc: z.string().optional(),
  depot: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.number().min(1, "Quantité > 0"),
  priceHT: z.number().min(0, "Prix >= 0"),
  discount: z.number().min(0).max(100),
  tva: z.number().min(0),
  totalHT: z.number(),
  totalTTC: z.number(),
});

const formSchema = z.object({
  clientId: z.string().min(1, "Client requis"),
  paymentMode: z.string().min(1, "Mode requis"),
  affaire: z.string().optional(),
  appellation: z.string().optional(),
  commercial: z.string().optional(),
  recup: z.string().optional(),
  observation: z.string().optional(),
  items: z.array(itemSchema).min(1, "Ajoutez au moins une ligne"),
});

type FormValues = z.infer<typeof formSchema>;

interface FormProps {
  initialData?: Partial<BonLivraison>;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export const BonLivraisonForm: React.FC<FormProps> = ({ initialData, onSubmit, onCancel }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      clientId: initialData?.clientId || "",
      paymentMode: "ESPÈCE",
      affaire: "",
      appellation: "",
      commercial: user?.name || "Agent",
      recup: "",
      items: (initialData?.items && Array.isArray(initialData.items)) 
        ? initialData.items.map((item: any) => ({
          productId: item.productId || "",
          code: item.product?.code || "",
          name: item.product?.name || "",
          consign: item.consign || "",
          bc: item.bc || "",
          depot: item.depot || "D01",
          unit: item.unit || "U",
          quantity: item.quantity || 1,
          priceHT: item.priceHT || 0,
          discount: item.discount || 0,
          tva: item.tva || 20,
          totalHT: item.totalHT || 0,
          totalTTC: item.totalTTC || 0,
        })) 
        : [{ productId: "", code: "", name: "", consign: "", bc: "", depot: "D01", unit: "U", quantity: 1, priceHT: 0, discount: 0, tva: 20, totalHT: 0, totalTTC: 0 }],
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  const watchedItems = watch("items") || [];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cRes, pRes] = await Promise.all([
          axios.get('/api/clients'),
          axios.get('/api/products')
        ]);
        setClients(Array.isArray(cRes.data) ? cRes.data : []);
        setProducts(Array.isArray(pRes.data) ? pRes.data : []);
      } catch (err) {
        console.error("Erreur chargement données:", err);
        setClients([]);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateLineTotals = (index: number) => {
    const item = watchedItems[index];
    if (item) {
      const lineHT = item.quantity * item.priceHT * (1 - item.discount / 100);
      const lineTVA = lineHT * (item.tva / 100);
      const lineTTC = lineHT + lineTVA;
      
      setValue(`items.${index}.totalHT`, Number(lineHT.toFixed(2)));
      setValue(`items.${index}.totalTTC`, Number(lineTTC.toFixed(2)));
    }
  };

  const totals = (watchedItems || []).reduce((acc, item) => ({
    ht: acc.ht + (Number(item?.totalHT) || 0),
    tva: acc.tva + ((Number(item?.totalTTC) || 0) - (Number(item?.totalHT) || 0)),
    ttc: acc.ttc + (Number(item?.totalTTC) || 0)
  }), { ht: 0, tva: 0, ttc: 0 });

  const onProductSelect = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setValue(`items.${index}.productId`, product.id);
      setValue(`items.${index}.code`, product.code);
      setValue(`items.${index}.name`, product.name);
      setValue(`items.${index}.priceHT`, product.sellPrice);
      setValue(`items.${index}.tva`, product.tva);
      setValue(`items.${index}.unit`, product.unit || "U");
      updateLineTotals(index);
    }
  };

  const [activeTab, setActiveTab] = useState<'info' | 'lines' | 'summary'>('info');

  if (loading) return <div className="p-20 text-center animate-pulse">Chargement des données...</div>;

  return (
    <div className="bg-white">
      {/* Tabs Navigation */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-2xl mb-6 w-fit mx-auto lg:mx-0">
        <button
          type="button"
          onClick={() => setActiveTab('info')}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'info' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Informations Générales
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('lines')}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'lines' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Lignes d'Articles
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('summary')}
          className={`px-6 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'summary' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Récapitulatif
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Tab 1: Informations Générales */}
        {activeTab === 'info' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Entité Form Grid - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-[#FEFDF8] rounded-t-3xl border-x border-t border-[#E9E2D0]">
               <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">N° B.L.</label>
                 <div className="flex items-center gap-2">
                   <input 
                     type="text" 
                     readOnly 
                     value={initialData?.reference || "5"} 
                     className="w-20 bg-gray-100 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-500 font-bold" 
                   />
                 </div>
               </div>
               <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date</label>
                 <input type="text" readOnly value={new Date().toLocaleDateString('fr-FR')} className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
               </div>
               <div className="flex flex-col gap-1.5 md:col-span-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mode Paiement</label>
                 <input type="text" {...register("paymentMode")} className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
               </div>
            </div>

            {/* Entité Form Grid - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-[#FEFDF8] border-x border-[#E9E2D0]">
               <div className="flex flex-col gap-1.5 md:col-span-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Code Client</label>
                 <div className="flex gap-2">
                   <select {...register("clientId")} className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none">
                      <option value="">Sélectionner...</option>
                      {Array.isArray(clients) && clients.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                   </select>
                   <button type="button" className="bg-slate-200 p-1.5 rounded-lg"><Search size={14}/></button>
                 </div>
               </div>
               <div className="flex flex-col gap-1.5 md:col-span-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Affaire :</label>
                 <select {...register("affaire")} className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm outline-none">
                    <option value="">-- Choisir --</option>
                    <option value="Projet A">Projet A</option>
                 </select>
               </div>
            </div>

            {/* Entité Form Grid - Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 bg-[#FEFDF8] rounded-b-3xl border-x border-b border-[#E9E2D0] mb-8">
               <div className="flex flex-col gap-1.5 md:col-span-2">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Appellation :</label>
                 <input type="text" {...register("appellation")} className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
               </div>
               <div className="flex flex-col gap-1.5">
                 <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Commercial :</label>
                 <input type="text" {...register("commercial")} className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm" />
               </div>
               <div className="flex items-center gap-2 pt-5">
                 <input type="checkbox" id="recu" {...register("recup" as any)} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                 <label htmlFor="recu" className="text-xs font-bold text-gray-600 uppercase flex items-center gap-1">
                   <div className="w-4 h-4 border border-slate-400 bg-white mr-1" /> Reçu
                 </label>
               </div>
            </div>
          </div>
        )}

        {/* Tab 2: Lignes d'Articles */}
        {activeTab === 'lines' && (
          <div className="mb-8 p-4 bg-white border border-gray-200 rounded-3xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between mb-4 border-b border-dashed pb-2">
              <div className="flex items-center gap-2 font-bold text-emerald-900">
                <ClipboardList size={20} /> Lignes d'articles
              </div>
              <button 
                type="button" 
                onClick={() => append({ productId: "", code: "", name: "", consign: "", bc: "", depot: "D01", unit: "U", quantity: 1, priceHT: 0, discount: 0, tva: 20, totalHT: 0, totalTTC: 0 })}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 px-4 py-2 rounded-full hover:bg-emerald-100 transition-colors"
              >
                + Ajouter une ligne
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#EEF2E6] text-gray-600">
                    <th className="p-3 border border-gray-200 w-24">N° Cons</th>
                    <th className="p-3 border border-gray-200 w-24">N° B.C</th>
                    <th className="p-3 border border-gray-200 w-24">Dépôt</th>
                    <th className="p-3 border border-gray-200 w-64 text-left">Code / Produit</th>
                    <th className="p-3 border border-gray-200 w-20">Qté</th>
                    <th className="p-3 border border-gray-200 w-16">Unité</th>
                    <th className="p-3 border border-gray-200 w-24">P/U TTC</th>
                    <th className="p-3 border border-gray-200 w-20">Remise%</th>
                    <th className="p-3 border border-gray-200 w-32 text-right">P TTC (MAD)</th>
                    <th className="p-3 border border-gray-200 w-20">TVA</th>
                    <th className="p-3 border border-gray-200 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id} className="hover:bg-gray-50">
                      <td className="p-1 border border-gray-100">
                        <input type="text" {...register(`items.${index}.consign`)} className="w-full bg-transparent p-1 outline-none text-center" />
                      </td>
                      <td className="p-1 border border-gray-100">
                        <input type="text" {...register(`items.${index}.bc`)} className="w-full bg-transparent p-1 outline-none text-center" />
                      </td>
                      <td className="p-1 border border-gray-100">
                        <input type="text" {...register(`items.${index}.depot`)} className="w-full bg-transparent p-1 outline-none text-center" />
                      </td>
                      <td className="p-1 border border-gray-100">
                        <select 
                          value={watchedItems[index]?.productId}
                          onChange={(e) => onProductSelect(index, e.target.value)}
                          className="w-full bg-transparent p-1 outline-none"
                        >
                          <option value="">-- Choisir --</option>
                          {Array.isArray(products) && products.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
                        </select>
                      </td>
                      <td className="p-1 border border-gray-100">
                        <input 
                          type="number"
                          {...register(`items.${index}.quantity`, { valueAsNumber: true, onChange: () => updateLineTotals(index) })}
                          className="w-full bg-transparent p-1 outline-none text-center font-bold"
                        />
                      </td>
                      <td className="p-1 border border-gray-100">
                        <input type="text" {...register(`items.${index}.unit`)} className="w-full bg-transparent p-1 outline-none text-center text-slate-400" />
                      </td>
                      <td className="p-1 border border-gray-100">
                        <input 
                          type="number" step="0.01"
                          {...register(`items.${index}.priceHT`, { valueAsNumber: true, onChange: () => updateLineTotals(index) })}
                          className="w-full bg-transparent p-1 outline-none text-right"
                        />
                      </td>
                      <td className="p-1 border border-gray-100">
                        <input 
                          type="number"
                          {...register(`items.${index}.discount`, { valueAsNumber: true, onChange: () => updateLineTotals(index) })}
                          className="w-full bg-transparent p-1 outline-none text-center"
                        />
                      </td>
                      <td className="p-1 border border-gray-100 text-right font-bold bg-gray-50">
                         {watchedItems[index]?.totalTTC?.toFixed(2)}
                      </td>
                      <td className="p-1 border border-gray-100">
                        <select 
                          {...register(`items.${index}.tva`, { valueAsNumber: true, onChange: () => updateLineTotals(index) })}
                          className="w-full bg-transparent p-1 outline-none text-center"
                        >
                           <option value={20}>20%</option>
                           <option value={10}>10%</option>
                           <option value={0}>0%</option>
                        </select>
                      </td>
                      <td className="p-1 border border-gray-100 text-center">
                         <button type="button" onClick={() => remove(index)} className="text-red-300 hover:text-red-600">
                           <Trash2 size={14} />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Récapitulatif */}
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Left Column: Obs & Model */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block">Observations & Notes</label>
                <textarea 
                  {...register("observation" as any)}
                  className="w-full h-32 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  placeholder="Notes internes, instructions de livraison..."
                ></textarea>
              </div>
              
              <div className="flex items-center justify-between gap-4 bg-gray-100 p-4 rounded-2xl border border-gray-200">
                 <div className="flex items-center gap-3">
                   <label className="text-[10px] font-bold text-gray-400 uppercase">Modèle d'Impression :</label>
                   <select className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-xs outline-none font-bold text-gray-600">
                     <option>Parabola A5 (Compact)</option>
                     <option>Standard A4 (Complet)</option>
                   </select>
                 </div>
                 <div className="text-[10px] font-bold text-slate-400 italic">
                   L'impression sera générée après validation.
                 </div>
              </div>
            </div>

            {/* Right Column: Calculations */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-[#FDFBF7] border border-[#E9E2D0] rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Remise sur Total</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-600">0.00%</span>
                    <span className="bg-white px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-mono">0.00 DH</span>
                  </div>
                </div>
                <div className="h-px bg-[#E9E2D0] opacity-50" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Poids Total Estimé</span>
                  <span className="text-sm font-black text-gray-600">0.00 KG</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Acompte / Réglé</span>
                  <span className="text-sm font-black text-emerald-600">0.00 DH</span>
                </div>
              </div>

              <div className="bg-emerald-900 text-white rounded-3xl p-6 shadow-xl shadow-emerald-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10">
                  <div className="space-y-3 mb-6 border-b border-white/10 pb-6">
                    <div className="flex justify-between text-xs opacity-70">
                      <span className="uppercase tracking-widest">Total HT Brut</span>
                      <span className="font-mono">{totals.ht.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold">
                      <span className="uppercase tracking-widest">Total TVA</span>
                      <span className="text-emerald-400 font-mono">{totals.tva.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-50">Total TTC (DHS MAD)</span>
                    <div className="flex justify-between items-end">
                      <span className="text-4xl font-black text-emerald-400 tracking-tighter">
                        {totals.ttc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                      </span>
                      <Calculator size={24} className="opacity-20 mb-1" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Global Bottom Summary & Actions */}
        <div className="sticky bottom-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 -mx-1 mt-auto flex flex-col md:flex-row items-center justify-between gap-4">
           {/* Quick Stats Summary */}
           <div className="flex gap-6 items-center">
              <div className="hidden sm:block">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Articles</p>
                 <p className="text-lg font-bold text-gray-700">{watchedItems.length}</p>
              </div>
              <div className="h-8 w-px bg-slate-200 hidden sm:block" />
              <div>
                 <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Total Net</p>
                 <p className="text-xl font-black text-emerald-700">{totals.ttc.toFixed(2)} <span className="text-xs font-medium">DH</span></p>
              </div>
           </div>

           {/* Actions Buttons */}
           <div className="flex items-center gap-3">
              <button type="button" className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-600 rounded-full font-bold text-xs hover:bg-slate-200 transition-all active:scale-95">
                <Trash2 size={14} /> Dévalider
              </button>
              <button type="button" onClick={onCancel} className="flex items-center gap-2 px-6 py-3 bg-red-50 text-red-700 rounded-full font-bold text-xs hover:bg-red-100 transition-all active:scale-95">
                <X size={14} /> Annuler
              </button>
              <button type="submit" className="flex items-center gap-2 px-10 py-3 bg-emerald-700 text-white rounded-full font-bold text-sm shadow-xl shadow-emerald-700/30 hover:bg-emerald-800 transition-all active:scale-95">
                <Check size={18} /> Valider / Ok
              </button>
           </div>
        </div>
      </form>
    </div>
  );
};
