import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const MouvementStock = lazy(() => import('../pages/MouvementStock').then(m => ({ default: m.MouvementStock })));
const MouvementStockFormModern = lazy(() => import('../pages/MouvementStockFormModern').then(m => ({ default: m.MouvementStockFormModern })));
const Inventaire = lazy(() => import('../pages/Inventaire').then(m => ({ default: m.Inventaire })));
const InventaireFormModern = lazy(() => import('../pages/InventaireFormModern').then(m => ({ default: m.InventaireFormModern })));

export const StockRoutes: React.FC = () => (
  <Routes>
    <Route path="mouvement" element={<MouvementStock />} />
    <Route path="mouvement/nouveau" element={<MouvementStockFormModern />} />
    <Route path="inventaire" element={<Inventaire />} />
    <Route path="inventaire/nouveau" element={<InventaireFormModern />} />
    <Route path="inventaire/:id" element={<InventaireFormModern />} />
  </Routes>
);
