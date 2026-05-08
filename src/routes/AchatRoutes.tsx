import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const DemandesPrix = lazy(() => import('../pages/DemandesPrix').then(m => ({ default: m.DemandesPrix })));
const DemandePrixFormModern = lazy(() => import('../pages/DemandePrixFormModern').then(m => ({ default: m.DemandePrixFormModern })));
const BonsReception = lazy(() => import('../pages/BonsReception').then(m => ({ default: m.BonsReception })));
const BonReceptionFormModern = lazy(() => import('../pages/BonReceptionFormModern').then(m => ({ default: m.BonReceptionFormModern })));
const FacturesFournisseur = lazy(() => import('../pages/FacturesFournisseur').then(m => ({ default: m.FacturesFournisseur })));
const FactureFournisseurFormModern = lazy(() => import('../pages/FactureFournisseurFormModern').then(m => ({ default: m.FactureFournisseurFormModern })));
const BonsRetourFournisseur = lazy(() => import('../pages/BonsRetourFournisseur').then(m => ({ default: m.BonsRetourFournisseur })));
const RetourFournisseurFormModern = lazy(() => import('../pages/RetourFournisseurFormModern').then(m => ({ default: m.RetourFournisseurFormModern })));
const BonsAvoirFournisseur = lazy(() => import('../pages/BonsAvoirFournisseur').then(m => ({ default: m.BonsAvoirFournisseur })));
const AvoirFournisseurFormModern = lazy(() => import('../pages/AvoirFournisseurFormModern').then(m => ({ default: m.AvoirFournisseurFormModern })));
const ReglementsFournisseur = lazy(() => import('../pages/ReglementsFournisseur').then(m => ({ default: m.ReglementsFournisseur })));
const ReglementFournisseurFormModern = lazy(() => import('../pages/ReglementFournisseurFormModern').then(m => ({ default: m.ReglementFournisseurFormModern })));

export const AchatRoutes: React.FC = () => (
  <Routes>
    <Route path="demande-prix" element={<DemandesPrix />} />
    <Route path="demande-prix/nouveau" element={<DemandePrixFormModern />} />
    <Route path="reception" element={<BonsReception />} />
    <Route path="reception/nouveau" element={<BonReceptionFormModern />} />
    <Route path="factures" element={<FacturesFournisseur />} />
    <Route path="factures/nouvelle" element={<FactureFournisseurFormModern />} />
    <Route path="retours" element={<BonsRetourFournisseur />} />
    <Route path="retours/nouveau" element={<RetourFournisseurFormModern />} />
    <Route path="avoirs" element={<BonsAvoirFournisseur />} />
    <Route path="avoirs/nouveau" element={<AvoirFournisseurFormModern />} />
    <Route path="reglements" element={<ReglementsFournisseur />} />
    <Route path="reglements/nouveau" element={<ReglementFournisseurFormModern />} />
  </Routes>
);
