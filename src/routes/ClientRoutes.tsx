import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const ConsultationProduit = lazy(() => import('../pages/ConsultationProduit').then(m => ({ default: m.ConsultationProduit })));
const ClientProfile = lazy(() => import('../pages/ClientProfile').then(m => ({ default: m.ClientProfile })));
const MesCommandes = lazy(() => import('../pages/MesCommandes').then(m => ({ default: m.MesCommandes })));
const MaCommande = lazy(() => import('../pages/MaCommande').then(m => ({ default: m.MaCommande })));
const Promotions = lazy(() => import('../pages/Promotions').then(m => ({ default: m.Promotions })));
const ContacterSimo = lazy(() => import('../pages/ContacterSimo').then(m => ({ default: m.ContacterSimo })));

export const ClientRoutes: React.FC = () => (
  <Routes>
    <Route path="consultation" element={<ConsultationProduit />} />
    <Route path="profile" element={<ClientProfile />} />
    <Route path="mes-commandes" element={<MesCommandes />} />
    <Route path="mes-commandes/:id" element={<MaCommande />} />
    <Route path="commande" element={<MaCommande />} />
    <Route path="promotions" element={<Promotions />} />
    <Route path="contact" element={<ContacterSimo />} />
  </Routes>
);
