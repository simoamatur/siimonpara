/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Plus, Edit2, Trash2, X, Shield, CheckSquare, Square, Save, ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

interface Permission {
  module: string;
  actions: { name: string; checked: boolean }[];
}

interface Role {
  id: string;
  code: string;
  libelle: string;
  description: string;
  permissions: Permission[];
}

const DEFAULT_PERMISSIONS: Permission[] = [
  { module: 'Ventes', actions: [{ name: 'Voir', checked: true }, { name: 'Créer', checked: true }, { name: 'Modifier', checked: false }, { name: 'Supprimer', checked: false }] },
  { module: 'Achats', actions: [{ name: 'Voir', checked: true }, { name: 'Créer', checked: false }, { name: 'Modifier', checked: false }, { name: 'Supprimer', checked: false }] },
  { module: 'Stocks', actions: [{ name: 'Voir', checked: true }, { name: 'Créer', checked: true }, { name: 'Modifier', checked: true }, { name: 'Supprimer', checked: false }] },
  { module: 'Paramétrage', actions: [{ name: 'Voir', checked: false }, { name: 'Créer', checked: false }, { name: 'Modifier', checked: false }, { name: 'Supprimer', checked: false }] },
  { module: 'Rapports', actions: [{ name: 'Voir', checked: true }, { name: 'Exporter', checked: true }, { name: 'Imprimer', checked: true }] },
];

export const Roles: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [formData, setFormData] = useState<Partial<Role>>({
    code: '',
    libelle: '',
    description: '',
  });

  const [permissions, setPermissions] = useState<Permission[]>(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));

  const fetchRoles = async () => {
    try {
      const res = await axios.get('/api/roles', { headers: { Authorization: `Bearer ${token}` } });
      setRoles(res.data || []);
    } catch (err) {
      console.error("Erreur chargement rôles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, [token]);

  const filteredRoles = roles.filter(r => 
    r.libelle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const togglePermission = (moduleIdx: number, actionIdx: number) => {
    const newPerms = [...permissions];
    newPerms[moduleIdx].actions[actionIdx].checked = !newPerms[moduleIdx].actions[actionIdx].checked;
    setPermissions(newPerms);
  };

  const handleAdd = () => {
    setSelectedRole(null);
    setFormData({ code: '', libelle: '', description: '' });
    setShowForm(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setFormData(role);
    setPermissions(role.permissions?.length ? JSON.parse(JSON.stringify(role.permissions)) : JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS)));
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...formData, permissions };
      if (selectedRole) {
        await axios.put(`/api/roles/${selectedRole.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/roles', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      await fetchRoles();
      setShowForm(false);
      toast('success', selectedRole ? 'Rôle modifié avec succès' : 'Rôle créé avec succès');
    } catch (err) {
      console.error("Erreur enregistrement rôle:", err);
      toast('error', "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: 'Supprimer ce rôle ?'}))) return;
    try {
      await axios.delete(`/api/roles/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchRoles();
    } catch (err) {
      console.error("Erreur suppression rôle:", err);
    }
  };

  return (
    <DashboardLayout title="Gestion des Rôles (RBAC)">
      <div className=" mx-auto">
        {!showForm ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><Shield size={24} /><h2 className="text-lg font-bold">Rôles & Permissions</h2></div>
                <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"><Plus size={18} /> Nouveau</button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Rechercher rôle..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full" />
                </div>
              </div>
              {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" size={32} /></div> : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-100"><tr><th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Code</th><th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Libellé</th><th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Description</th><th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Action</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRoles.map((role) => (
                      <tr key={role.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-bold text-gray-700">{role.code}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{role.libelle}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{role.description}</td>
                        <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => handleEdit(role)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button><button onClick={() => handleDelete(role.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><Shield size={24} /><h2 className="text-lg font-bold">{selectedRole ? 'Modifier Rôle' : 'Nouveau Rôle'}</h2></div>
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"><ArrowLeft size={18} /> Retour</button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Code Rôle:</label><input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="ADMIN" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Libellé:</label><input type="text" value={formData.libelle} onChange={(e) => setFormData({ ...formData, libelle: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" placeholder="Administrateur" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Description:</label><input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden mb-6">
                <div className="bg-emerald-50 px-4 py-3 border-b border-gray-200"><h3 className="text-sm font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-2"><Shield size={16} /> Permissions</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100"><tr><th className="px-4 py-2 text-left text-xs font-bold text-gray-600">Module</th><th className="px-4 py-2 text-center text-xs font-bold text-gray-600">Voir</th><th className="px-4 py-2 text-center text-xs font-bold text-gray-600">Créer</th><th className="px-4 py-2 text-center text-xs font-bold text-gray-600">Modifier</th><th className="px-4 py-2 text-center text-xs font-bold text-gray-600">Supprimer</th></tr></thead>
                    <tbody className="divide-y divide-slate-100">
                      {permissions.map((perm, mIdx) => (
                        <tr key={perm.module} className="hover:bg-white">
                          <td className="px-4 py-2 text-sm font-medium text-gray-700">{perm.module}</td>
                          {perm.actions.map((action, aIdx) => (
                            <td key={action.name} className="px-4 py-2 text-center">
                              <button onClick={() => togglePermission(mIdx, aIdx)} className="p-1 hover:bg-gray-100 rounded transition-colors">
                                {action.checked ? <CheckSquare size={20} className="text-emerald-600" /> : <Square size={20} className="text-slate-300" />}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 pt-6 border-t border-gray-200">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold disabled:opacity-50"><Save size={18} /> {saving ? "Enregistrement..." : "Enregistrer"}</button>
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 px-6 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-bold"><X size={18} /> Annuler</button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};
