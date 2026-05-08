import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const BonLivraisonModern = lazy(() => import('../pages/BonLivraisonModern').then(m => ({ default: m.BonLivraisonModern })));
const BonLivraisonFormModern = lazy(() => import('../pages/BonLivraisonFormModern').then(m => ({ default: m.BonLivraisonFormModern })));
const FacturesModern = lazy(() => import('../pages/FacturesModern').then(m => ({ default: m.FacturesModern })));
const FactureFormModern = lazy(() => import('../pages/FactureFormModern').then(m => ({ default: m.FactureFormModern })));
const BonsRetourModern = lazy(() => import('../pages/BonsRetourModern').then(m => ({ default: m.BonsRetourModern })));
const BonRetourFormModern = lazy(() => import('../pages/BonRetourFormModern').then(m => ({ default: m.BonRetourFormModern })));
const BonsAvoirModern = lazy(() => import('../pages/BonsAvoirModern').then(m => ({ default: m.BonsAvoirModern })));
const BonAvoirFormModern = lazy(() => import('../pages/BonAvoirFormModern').then(m => ({ default: m.BonAvoirFormModern })));
const ReglementsModern = lazy(() => import('../pages/ReglementsModern').then(m => ({ default: m.ReglementsModern })));
const ReglementFormModern = lazy(() => import('../pages/ReglementFormModern').then(m => ({ default: m.ReglementFormModern })));
const FactureAutoModern = lazy(() => import('../pages/FactureAutoModern').then(m => ({ default: m.FactureAutoModern })));
const AutomationRuleFormModern = lazy(() => import('../pages/AutomationRuleFormModern').then(m => ({ default: m.AutomationRuleFormModern })));
const SuiviLivraisonModern = lazy(() => import('../pages/SuiviLivraisonModern').then(m => ({ default: m.SuiviLivraisonModern })));
const DeliveryRouteFormModern = lazy(() => import('../pages/DeliveryRouteFormModern').then(m => ({ default: m.DeliveryRouteFormModern })));
const AffectationDocuments = lazy(() => import('../pages/AffectationDocuments').then(m => ({ default: m.AffectationDocuments })));
const EtatLivraisonLivreur = lazy(() => import('../pages/EtatLivraisonLivreur').then(m => ({ default: m.EtatLivraisonLivreur })));
const SortieDocuments = lazy(() => import('../pages/SortieDocuments').then(m => ({ default: m.SortieDocuments })));
const RetourDocuments = lazy(() => import('../pages/RetourDocuments').then(m => ({ default: m.RetourDocuments })));

export const VenteRoutes: React.FC = () => (
  <Routes>
    <Route path="bon-livraison" element={<BonLivraisonModern />} />
    <Route path="bon-livraison/nouveau" element={<BonLivraisonFormModern />} />
    <Route path="factures" element={<FacturesModern />} />
    <Route path="factures/nouvelle" element={<FactureFormModern />} />
    <Route path="retour" element={<BonsRetourModern />} />
    <Route path="retour/nouveau" element={<BonRetourFormModern />} />
    <Route path="avoir" element={<BonsAvoirModern />} />
    <Route path="avoir/nouveau" element={<BonAvoirFormModern />} />
    <Route path="paiement" element={<ReglementsModern />} />
    <Route path="paiement/nouveau" element={<ReglementFormModern />} />
    <Route path="facture-auto" element={<FactureAutoModern />} />
    <Route path="facture-auto/nouvelle-regle" element={<AutomationRuleFormModern />} />
    <Route path="suivi" element={<SuiviLivraisonModern />} />
    <Route path="suivi/nouvelle-route" element={<DeliveryRouteFormModern />} />
    <Route path="suivi/affectation" element={<AffectationDocuments />} />
    <Route path="suivi/etat-livreur" element={<EtatLivraisonLivreur />} />
    <Route path="suivi/sortie" element={<SortieDocuments />} />
    <Route path="suivi/retour" element={<RetourDocuments />} />
  </Routes>
);
