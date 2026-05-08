/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { Search, Plus, Edit2, Trash2, X, User, Mail, Lock, Shield, Save, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../contexts/ConfirmContext';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  actif: boolean;
  derniereConnexion: string;
}

export const Users: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { token } = useAuth();
  const { toast } = useToast();
  const confirm = useConfirm();

  const [formData, setFormData] = useState<Partial<UserItem & { password: string }>>({
    name: '',
    email: '',
    role: 'USER',
    password: '',
    actif: true,
  });

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users', { headers: { Authorization: `Bearer ${token}` } });
      setUsers(res.data || []);
    } catch (err) {
      console.error("Erreur chargement utilisateurs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedUser(null);
    setFormData({ name: '', email: '', role: 'USER', password: '', actif: true });
    setShowForm(true);
  };

  const handleEdit = (user: UserItem) => {
    setSelectedUser(user);
    setFormData({ ...user, password: '' });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (selectedUser) {
        await axios.put(`/api/users/${selectedUser.id}`, formData, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/users', formData, { headers: { Authorization: `Bearer ${token}` } });
      }
      await fetchUsers();
      setShowForm(false);
      toast('success', selectedUser ? 'Utilisateur modifié avec succès' : 'Utilisateur créé avec succès');
    } catch (err) {
      console.error("Erreur enregistrement utilisateur:", err);
      toast('error', "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm({ message: 'Supprimer cet utilisateur ?'}))) return;
    try {
      await axios.delete(`/api/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      await fetchUsers();
    } catch (err) {
      console.error("Erreur suppression utilisateur:", err);
    }
  };

  return (
    <DashboardLayout title="Gestion des Utilisateurs">
      <div className=" mx-auto">
        {!showForm ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-800 to-emerald-700 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"><User size={24} /><h2 className="text-lg font-bold">Utilisateurs</h2></div>
                <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"><Plus size={18} /> Nouveau</button>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input type="text" placeholder="Rechercher utilisateur..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full" />
                </div>
              </div>
              {loading ? <div className="flex justify-center py-12"><Loader2 className="animate-spin text-emerald-600" size={32} /></div> : (
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <table className="w-full">
                  <thead className="bg-gray-100"><tr><th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Nom</th><th className="px-4 py-3 text-left text-xs font-bold text-gray-600">Email</th><th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Rôle</th><th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Statut</th><th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Dernière Connexion</th><th className="px-4 py-3 text-center text-xs font-bold text-gray-600">Action</th></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-700 flex items-center gap-2"><User size={16} className="text-slate-400" /> {user.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                        <td className="px-4 py-3 text-center"><span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{user.role}</span></td>
                        <td className="px-4 py-3 text-center">{user.actif ? <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">Actif</span> : <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full font-medium">Inactif</span>}</td>
                        <td className="px-4 py-3 text-sm text-center text-gray-500">{user.derniereConnexion}</td>
                        <td className="px-4 py-3 text-center"><div className="flex items-center justify-center gap-1"><button onClick={() => handleEdit(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16} /></button><button onClick={() => handleDelete(user.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button></div></td>
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
                <div className="flex items-center gap-3"><User size={24} /><h2 className="text-lg font-bold">{selectedUser ? 'Modifier Utilisateur' : 'Nouvel Utilisateur'}</h2></div>
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm font-medium"><ArrowLeft size={18} /> Retour</button>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Nom Complet:</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Email:</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Rôle:</label><select value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"><option value="USER">Utilisateur</option><option value="ADMIN">Administrateur</option><option value="VENDEUR">Vendeur</option><option value="CAISSIER">Caissier</option><option value="MAGASINIER">Magasinier</option></select></div>
                <div className="space-y-2"><label className="text-sm font-bold text-gray-600">Mot de passe{selectedUser && ' (laisser vide pour garder)'}:</label><input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <div className="space-y-2 flex items-center gap-4 pt-6"><label className="flex items-center gap-2"><input type="checkbox" checked={formData.actif} onChange={(e) => setFormData({ ...formData, actif: e.target.checked })} className="w-4 h-4 text-emerald-600" /><span className="text-sm text-gray-600">Compte actif</span></label></div>
              </div>
              <div className="flex items-center justify-center gap-3 pt-6 border-t border-gray-200">
                <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-bold"><Save size={18} /> Enregistrer</button>
                <button onClick={() => setShowForm(false)} className="flex items-center gap-2 px-6 py-2.5 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-bold"><X size={18} /> Annuler</button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};
