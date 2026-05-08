import React, { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

const EtatStock = lazy(() => import('../pages/EtatStock').then(m => ({ default: m.EtatStock })));
const JournalVentes = lazy(() => import('../pages/JournalVentes').then(m => ({ default: m.JournalVentes })));
const ReleveClient = lazy(() => import('../pages/ReleveClient').then(m => ({ default: m.ReleveClient })));

export const ConsultationRoutes: React.FC = () => (
  <Routes>
    <Route path="stock" element={<EtatStock />} />
    <Route path="ventes" element={<JournalVentes />} />
    <Route path="releve" element={<ReleveClient />} />
  </Routes>
);
