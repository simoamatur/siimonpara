import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const Clients = lazy(() => import('../pages/Clients').then(m => ({ default: m.Clients })));
const FicheClient = lazy(() => import('../pages/FicheClient').then(m => ({ default: m.FicheClient })));
const Fournisseurs = lazy(() => import('../pages/Fournisseurs').then(m => ({ default: m.Fournisseurs })));
const Produits = lazy(() => import('../pages/Produits').then(m => ({ default: m.Produits })));
const ArticlesNomenclature = lazy(() => import('../pages/ArticlesNomenclature').then(m => ({ default: m.ArticlesNomenclature })));
const AdminPromotions = lazy(() => import('../pages/AdminPromotions').then(m => ({ default: m.AdminPromotions })));
const TVA = lazy(() => import('../pages/TVA').then(m => ({ default: m.TVA })));
const Users = lazy(() => import('../pages/Users').then(m => ({ default: m.Users })));
const Roles = lazy(() => import('../pages/Roles').then(m => ({ default: m.Roles })));
const Livreurs = lazy(() => import('../pages/Livreurs').then(m => ({ default: m.Livreurs })));
const CategorieClient = lazy(() => import('../pages/CategorieClient').then(m => ({ default: m.CategorieClient })));
const Zone = lazy(() => import('../pages/Zone').then(m => ({ default: m.Zone })));
const Ville = lazy(() => import('../pages/Ville').then(m => ({ default: m.Ville })));
const GroupRemise = lazy(() => import('../pages/GroupRemise').then(m => ({ default: m.GroupRemise })));
const Depot = lazy(() => import('../pages/Depot').then(m => ({ default: m.Depot })));
const Famille = lazy(() => import('../pages/Famille').then(m => ({ default: m.Famille })));
const SousFamille = lazy(() => import('../pages/SousFamille').then(m => ({ default: m.SousFamille })));
const ModeReglement = lazy(() => import('../pages/ModeReglement').then(m => ({ default: m.ModeReglement })));

export const ParamRoutes: React.FC = () => (
  <Routes>
    <Route path="clients" element={<Clients />} />
    <Route path="clients/:id" element={<FicheClient />} />
    <Route path="fournisseurs" element={<Fournisseurs />} />
    <Route path="produits" element={<Produits />} />
    <Route path="nomenclature" element={<ArticlesNomenclature />} />
    <Route path="promotions" element={<AdminPromotions />} />
    <Route path="tva" element={<TVA />} />
    <Route path="users" element={<Users />} />
    <Route path="roles" element={<Roles />} />
    <Route path="livreurs" element={<Livreurs />} />
    <Route path="cat-client" element={<CategorieClient />} />
    <Route path="zone" element={<Zone />} />
    <Route path="ville" element={<Ville />} />
    <Route path="group-remise" element={<GroupRemise />} />
    <Route path="depot" element={<Depot />} />
    <Route path="famille" element={<Famille />} />
    <Route path="sous-famille" element={<SousFamille />} />
    <Route path="mode-paiement" element={<ModeReglement />} />
  </Routes>
);
