/**
 * Tableau de Bord ERP - Vue d'ensemble Sécurisée
 * Dashboard analytics avec KPIs, graphiques, alertes et aide à la décision
 * Refactorisé: typage strict, accessibilité, performance, sécurité
 */

import React, { useState, useMemo, useCallback, memo } from 'react';
import { DashboardLayout } from '../components/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import type { LucideIcon } from 'lucide-react';
import {
  DollarSign, ShoppingCart, Package, Users, Building2,
  CreditCard, AlertTriangle, CheckCircle, Clock,
  BarChart3, Activity, Eye,
  FileText, Truck, Receipt, RotateCcw,
  ArrowRight, Wallet, Boxes,
  ChevronUp, ChevronDown, Zap, Target, Calendar,
  ShoppingBag, Archive, TrendingUp
} from 'lucide-react';

// ============================================
// TYPES STRICTS
// ============================================

type Period = 'day' | 'week' | 'month' | 'year';
type ColorTheme = 'emerald' | 'blue' | 'amber' | 'violet' | 'rose' | 'cyan';
type AlertType = 'danger' | 'warning' | 'info';
type ActivityType = 'vente' | 'achat';
type InvoiceStatus = 'paid' | 'partial' | 'draft' | 'sent' | 'received' | 'validated';

interface EvolutionPoint {
  month: string;
  ventes: number;
  achats: number;
}

interface AlertItem {
  id: number;
  type: AlertType;
  message: string;
  module: string;
  montant: number;
}

interface SaleItem {
  id: string;
  client: string;
  date: string;
  montant: number;
  status: InvoiceStatus;
}

interface PurchaseItem {
  id: string;
  fournisseur: string;
  date: string;
  montant: number;
  status: InvoiceStatus;
}

interface ClientStat {
  name: string;
  ca: number;
  evolution: number;
  factures: number;
}

interface ProductStat {
  name: string;
  ventes: number;
  stock: number;
  ca: number;
}

interface PaymentData {
  paid: number;
  partial: number;
  overdue: number;
}

interface StockItem {
  label: string;
  value: number | string;
  color: string;
}

interface QuickButton {
  label: string;
  path: string;
  icon: LucideIcon;
  color: string;
}

const QUICK_BUTTONS: readonly QuickButton[] = [
  { label: 'Nouveau BL', path: '/dashboard/vente/bon-livraison/nouveau', icon: Truck, color: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' },
  { label: 'Nouvelle Facture', path: '/dashboard/vente/factures/nouvelle', icon: FileText, color: 'bg-blue-50 text-gray-700 border-blue-200 hover:bg-blue-100' },
  { label: 'Nouveau Paiement', path: '/dashboard/vente/paiement/nouveau', icon: CreditCard, color: 'bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100' },
  { label: 'Bon Réception', path: '/dashboard/achat/reception/nouveau', icon: Archive, color: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
  { label: 'Mouvement Stock', path: '/dashboard/stock/mouvement/nouveau', icon: Boxes, color: 'bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100' },
  { label: 'Nouveau Client', path: '/dashboard/param/clients', icon: Users, color: 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' },
] as const;

const PERIOD_LABELS: Record<Period, string> = {
  day: 'Jour', week: 'Semaine', month: 'Mois', year: 'Année',
};

// ============================================
// HELPERS
// ============================================

const formatCurrency = (v: number): string => {
  if (!Number.isFinite(v)) return '0 DH';
  return v.toLocaleString('fr-FR') + ' DH';
};

const BG_COLORS: Record<ColorTheme, string> = {
  emerald: 'bg-emerald-50 border-emerald-200',
  blue: 'bg-blue-50 border-blue-200',
  amber: 'bg-amber-50 border-amber-200',
  violet: 'bg-violet-50 border-violet-200',
  rose: 'bg-rose-50 border-rose-200',
  cyan: 'bg-cyan-50 border-cyan-200',
};

const ICON_COLORS: Record<ColorTheme, string> = {
  emerald: 'text-emerald-600 bg-emerald-100',
  blue: 'text-gray-700 bg-blue-100',
  amber: 'text-amber-600 bg-amber-100',
  violet: 'text-violet-600 bg-violet-100',
  rose: 'text-rose-600 bg-rose-100',
  cyan: 'text-cyan-600 bg-cyan-100',
};

const STATUS_STYLES: Record<InvoiceStatus, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  partial: 'bg-amber-100 text-amber-700',
  draft: 'bg-gray-100 text-gray-500',
  sent: 'bg-blue-100 text-blue-700',
  received: 'bg-blue-100 text-blue-700',
  validated: 'bg-emerald-100 text-emerald-700',
};

const STATUS_LABELS: Record<InvoiceStatus, string> = {
  paid: 'Payée', partial: 'Partiel', draft: 'Brouillon', sent: 'Envoyée',
  received: 'Reçue', validated: 'Validée',
};

const ALERT_COLORS: Record<AlertType, string> = {
  danger: 'bg-red-50 border-red-200 text-red-700',
  warning: 'bg-amber-50 border-amber-200 text-amber-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
};

const ALERT_ICONS: Record<AlertType, LucideIcon> = {
  danger: AlertTriangle,
  warning: Clock,
  info: Zap,
};

// ============================================
// COMPOSANTS MÉMORISÉS (performance)
// ============================================

interface KPICardProps {
  icon: LucideIcon;
  title: string;
  value: string;
  sub?: string;
  trend?: number;
  trendUp?: boolean;
  onClick: () => void;
  color: ColorTheme;
}

const KPICard = memo<KPICardProps>(({ icon: Icon, title, value, sub, trend, trendUp, onClick, color }) => (
  <button
    onClick={onClick}
    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${BG_COLORS[color]}`}
    aria-label={`${title}: ${value}`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`p-3 rounded-xl ${ICON_COLORS[color]}`}>
        <Icon size={24} aria-hidden="true" />
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {trendUp ? <ChevronUp size={14} aria-hidden="true" /> : <ChevronDown size={14} aria-hidden="true" />}
          {trend}%
        </div>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-700 mb-1">{value}</p>
    <p className="text-sm text-gray-500 font-medium">{title}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </button>
));
KPICard.displayName = 'KPICard';

interface SectionTitleProps {
  icon: LucideIcon;
  title: string;
  action?: string;
  onAction?: () => void;
}

const SectionTitle = memo<SectionTitleProps>(({ icon: Icon, title, action, onAction }) => (
  <div className="flex items-center justify-between mb-4">
    <div className="flex items-center gap-2">
      <Icon size={20} className="text-emerald-600" aria-hidden="true" />
      <h2 className="text-lg font-bold text-gray-700">{title}</h2>
    </div>
    {action && onAction && (
      <button
        onClick={onAction}
        className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
        aria-label={action}
      >
        {action} <ArrowRight size={14} aria-hidden="true" />
      </button>
    )}
  </div>
));
SectionTitle.displayName = 'SectionTitle';

interface StatusBadgeProps {
  status: InvoiceStatus;
}

const StatusBadge = memo<StatusBadgeProps>(({ status }) => (
  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_STYLES[status]}`}>
    {STATUS_LABELS[status]}
  </span>
));
StatusBadge.displayName = 'StatusBadge';

interface SimpleBarChartProps {
  data: EvolutionPoint[];
}

const SimpleBarChart = memo<SimpleBarChartProps>(function SimpleBarChart({ data }) {
  const max = useMemo(() => data.length > 0 ? Math.max(...data.map(d => Math.max(d.ventes, d.achats))) : 0, [data]);
  const h = 140;
  const barW = 6;
  const gap = 8;

  if (max === 0 || data.length === 0) return <p className="text-sm text-gray-400 text-center py-8">Aucune donnée à afficher</p>;

  return (
    <div className="relative" role="img" aria-label="Graphique évolution ventes vs achats sur 6 mois">
      <svg viewBox="0 0 120 160" className="w-full h-48" preserveAspectRatio="none">
        {[0, 0.25, 0.5, 0.75, 1].map(p => (
          <line key={String(p)} x1="0" y1={h - p * h + 20} x2="120" y2={h - p * h + 20} stroke="#e2e8f0" strokeWidth="0.5" />
        ))}
        {data.map((d, i) => {
          const x = 10 + i * (barW * 2 + gap);
          const vh = (d.ventes / max) * h;
          const ah = (d.achats / max) * h;
          return (
            <g key={d.month}>
              <rect x={x} y={h - vh + 20} width={barW} height={vh} rx="2" fill="#10b981" opacity="0.85" />
              <rect x={x + barW + 1} y={h - ah + 20} width={barW} height={ah} rx="2" fill="#3b82f6" opacity="0.85" />
              <text x={x + barW} y={h + 32} fontSize="6" textAnchor="middle" fill="#64748b">{d.month}</text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-center gap-6 mt-2">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500" aria-hidden="true" /><span className="text-xs text-gray-500">Ventes</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-blue-500" aria-hidden="true" /><span className="text-xs text-gray-500">Achats</span></div>
      </div>
    </div>
  );
});

interface PaymentDonutProps {
  label: string;
  data: PaymentData;
}

const PaymentDonut = memo<PaymentDonutProps>(({ label, data }) => {
  const total = data.paid + data.partial + data.overdue;
  const r = 28;
  const c = 2 * Math.PI * r;

  if (total === 0) return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 80 80" className="w-20 h-20"><circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" /></svg>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
      <p className="text-sm font-bold text-gray-600">0 DH</p>
    </div>
  );

  const p1 = (data.paid / total) * c;
  const p2 = (data.partial / total) * c;

  return (
    <div className="flex flex-col items-center" role="img" aria-label={`${label}: ${formatCurrency(total)} total`}>
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="#10b981" strokeWidth="8" strokeDasharray={`${p1} ${c - p1}`} strokeDashoffset="0" strokeLinecap="round" transform="rotate(-90 40 40)" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="#f59e0b" strokeWidth="8" strokeDasharray={`${p2} ${c - p2}`} strokeDashoffset={-p1} strokeLinecap="round" transform="rotate(-90 40 40)" />
        <circle cx="40" cy="40" r={r} fill="none" stroke="#ef4444" strokeWidth="8" strokeDasharray={`${c - p1 - p2} ${p1 + p2}`} strokeDashoffset={-(p1 + p2)} strokeLinecap="round" transform="rotate(-90 40 40)" />
      </svg>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
      <p className="text-sm font-bold text-gray-600">{formatCurrency(total)}</p>
    </div>
  );
});
PaymentDonut.displayName = 'PaymentDonut';

interface ProgressBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

const ProgressBar = memo<ProgressBarProps>(({ label, value, max, color }) => {
  const pct = useMemo(() => Math.min(100, max > 0 ? (value / max) * 100 : 0), [value, max]);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 font-medium">{label}</span>
        <span className="text-gray-700 font-bold">{value.toLocaleString('fr-FR')}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div className={`${color} h-2.5 rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
});
ProgressBar.displayName = 'ProgressBar';

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

interface DashboardData {
  kpis: { ventesMois: number; achatsMois: number; marge: number; valeurStock: number; clientsActifs: number; fournisseurs: number; facturesMois: number; facturesAchatMois: number; blEnCours: number; retoursMois: number };
  evolution: EvolutionPoint[];
  alerts: AlertItem[];
  recentActivity: { id: string; type: ActivityType; entity: string; montant: number; date: string }[];
  topClients: { name: string; ca: number; factures: number }[];
  topProducts: { name: string; ventes: number; stock: number; ca: number }[];
  paymentStatus: { clients: PaymentData; fournisseurs: PaymentData };
  stockSummary: { totalProduits: number; stockCritique: number; stockAlerte: number; valeurStock: number };
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('month');
  const { data, loading } = useApi<DashboardData>('/api/dashboard');

  const evolution = data?.evolution ?? [];
  const recentActivity = data?.recentActivity ?? [];
  const topClients = data?.topClients ?? [];
  const topProducts = data?.topProducts ?? [];
  const alerts = data?.alerts ?? [];
  const paymentStatus = data?.paymentStatus ?? { clients: { paid: 0, partial: 0, overdue: 0 }, fournisseurs: { paid: 0, partial: 0, overdue: 0 } };
  const kpis = data?.kpis ?? { ventesMois: 0, achatsMois: 0, marge: 0, valeurStock: 0, clientsActifs: 0, fournisseurs: 0, facturesMois: 0, facturesAchatMois: 0, blEnCours: 0, retoursMois: 0 };
  const stockSummary = data?.stockSummary ?? { totalProduits: 0, stockCritique: 0, stockAlerte: 0, valeurStock: 0 };

  const totalVentes = useMemo(() => evolution.reduce((s, d) => s + d.ventes, 0), [evolution]);
  const totalAchats = useMemo(() => evolution.reduce((s, d) => s + d.achats, 0), [evolution]);
  const marge = totalVentes - totalAchats;
  const margePct = useMemo(() => {
    if (totalVentes <= 0) return '0.0';
    return ((marge / totalVentes) * 100).toFixed(1);
  }, [marge, totalVentes]);

  const handleNavigate = useCallback((path: string) => () => navigate(path), [navigate]);
  const handleSetPeriod = useCallback((p: Period) => () => setPeriod(p), []);

  const todayLabel = useMemo(() =>
    new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  []);

  return (
    <DashboardLayout title="Tableau de bord">
      <div className="p-6 space-y-6">

        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-700">Vue d'ensemble</h1>
            <p className="text-sm text-gray-400 mt-1">Analyse complète de l'activité - {todayLabel}</p>
          </div>
          <div className="flex bg-white rounded-xl border border-gray-200 p-1" role="group" aria-label="Sélection de période">
            {(['day', 'week', 'month', 'year'] as Period[]).map(p => (
              <button
                key={p}
                onClick={handleSetPeriod(p)}
                aria-pressed={period === p}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${period === p ? 'bg-emerald-500 text-white shadow' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard icon={DollarSign} title="Ventes du mois" value={formatCurrency(kpis.ventesMois)} sub={`${kpis.facturesMois} facture(s)`} color="emerald" onClick={handleNavigate('/dashboard/vente/factures')} />
          <KPICard icon={ShoppingCart} title="Achats du mois" value={formatCurrency(kpis.achatsMois)} sub={`${kpis.facturesAchatMois} facture(s)`} color="blue" onClick={handleNavigate('/dashboard/achat/factures')} />
          <KPICard icon={Wallet} title="Marge brute" value={formatCurrency(kpis.marge)} sub={`${margePct}% de marge`} color="violet" onClick={handleNavigate('/dashboard/cons/ventes')} />
          <KPICard icon={Package} title="Valeur stock" value={formatCurrency(kpis.valeurStock)} sub={`${stockSummary.totalProduits} produit(s)`} color="amber" onClick={handleNavigate('/dashboard/cons/stock')} />
        </div>

        {/* SECONDARY KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <KPICard icon={Users} title="Clients actifs" value={String(kpis.clientsActifs)} color="cyan" onClick={handleNavigate('/dashboard/param/clients')} />
          <KPICard icon={Building2} title="Fournisseurs" value={String(kpis.fournisseurs)} color="rose" onClick={handleNavigate('/dashboard/param/fournisseurs')} />
          <KPICard icon={FileText} title="Factures vente" value={String(kpis.facturesMois)} sub={`${kpis.facturesMois} ce mois`} color="emerald" onClick={handleNavigate('/dashboard/vente/factures')} />
          <KPICard icon={Receipt} title="Factures achat" value={String(kpis.facturesAchatMois)} color="blue" onClick={handleNavigate('/dashboard/achat/factures')} />
          <KPICard icon={Truck} title="BL en cours" value={String(kpis.blEnCours)} sub="Non validés" color="amber" onClick={handleNavigate('/dashboard/vente/bon-livraison')} />
          <KPICard icon={RotateCcw} title="Retours" value={String(kpis.retoursMois)} sub="Ce mois" color="violet" onClick={handleNavigate('/dashboard/vente/retour')} />
        </div>

        {/* CHARTS + ALERTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
            <SectionTitle icon={BarChart3} title="Évolution Ventes vs Achats" />
            <SimpleBarChart data={evolution} />
            <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="text-center"><p className="text-xs text-gray-400">Total Ventes (6 mois)</p><p className="text-lg font-bold text-emerald-600">{formatCurrency(totalVentes)}</p></div>
              <div className="text-center"><p className="text-xs text-gray-400">Total Achats (6 mois)</p><p className="text-lg font-bold text-gray-700">{formatCurrency(totalAchats)}</p></div>
              <div className="text-center"><p className="text-xs text-gray-400">Marge cumulée</p><p className="text-lg font-bold text-violet-600">{formatCurrency(marge)}</p></div>
            </div>
          </div>

          {/* ALERTS */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <SectionTitle icon={AlertTriangle} title="Alertes & Actions" />
            <div className="space-y-3" role="list" aria-label="Alertes et notifications">
              {alerts.map((alert, idx) => {
                const AlertIcon = ALERT_ICONS[alert.type];
                return (
                  <div
                    key={idx}
                    role="listitem"
                    className={`p-3 rounded-xl border text-sm ${ALERT_COLORS[alert.type]}`}
                  >
                    <div className="flex items-start gap-2">
                      <AlertIcon size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs opacity-70">{alert.module}</span>
                          {alert.montant > 0 && <span className="text-xs font-bold">{formatCurrency(alert.montant)}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY + TOP LISTS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <SectionTitle icon={Activity} title="Activité récente" action="Voir tout" onAction={handleNavigate('/dashboard/cons/ventes')} />
            <div className="space-y-3">
              {recentActivity.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${item.type === 'vente' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-gray-700'}`}>
                    {item.type === 'vente' ? <ShoppingCart size={16} aria-hidden="true" /> : <ShoppingBag size={16} aria-hidden="true" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{item.id}</p>
                    <p className="text-xs text-gray-400 truncate">{item.entity}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-700">{formatCurrency(item.montant)}</p>
                    <p className="text-xs text-gray-400">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <SectionTitle icon={Users} title="Top Clients" action="Tous" onAction={handleNavigate('/dashboard/param/clients')} />
            <div className="space-y-3">
              {topClients.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun client</p>}
              {topClients.map((client, i) => (
                <div key={client.name} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0" aria-hidden="true">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{client.name}</p>
                    <p className="text-xs text-gray-400">{client.factures} facture(s)</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-700">{formatCurrency(client.ca)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <SectionTitle icon={Target} title="Top Produits" action="Tous" onAction={handleNavigate('/dashboard/param/produits')} />
            <div className="space-y-3">
              {topProducts.length === 0 && <p className="text-sm text-gray-400 text-center py-4">Aucun produit</p>}
              {topProducts.map((prod, idx) => {
                const maxSales = Math.max(...topProducts.map(p => p.ventes), 1);
                return (
                <div key={prod.name + idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-600 truncate max-w-[70%]">{prod.name}</span>
                    <span className="font-bold text-gray-700">{prod.ventes} vente(s)</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-2 rounded-full" style={{ width: `${(prod.ventes / maxSales) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className={`${prod.stock < 10 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>Stock: {prod.stock}</span>
                    <span className="text-gray-400">{formatCurrency(prod.ca)}</span>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>

        {/* FINANCIAL STATUS + STOCK */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
            <SectionTitle icon={CreditCard} title="État des règlements" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="text-center">
                <PaymentDonut label="Clients" data={paymentStatus.clients} />
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div><div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-1" aria-hidden="true" /><span className="text-gray-400">Payé</span><p className="font-bold text-gray-700">{formatCurrency(paymentStatus.clients.paid)}</p></div>
                  <div><div className="w-2 h-2 rounded-full bg-amber-500 mx-auto mb-1" aria-hidden="true" /><span className="text-gray-400">Partiel</span><p className="font-bold text-gray-700">{formatCurrency(paymentStatus.clients.partial)}</p></div>
                  <div><div className="w-2 h-2 rounded-full bg-red-500 mx-auto mb-1" aria-hidden="true" /><span className="text-gray-400">Impayé</span><p className="font-bold text-gray-700">{formatCurrency(paymentStatus.clients.overdue)}</p></div>
                </div>
              </div>
              <div className="text-center">
                <PaymentDonut label="Fournisseurs" data={paymentStatus.fournisseurs} />
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  <div><div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-1" aria-hidden="true" /><span className="text-gray-400">Payé</span><p className="font-bold text-gray-700">{formatCurrency(paymentStatus.fournisseurs.paid)}</p></div>
                  <div><div className="w-2 h-2 rounded-full bg-amber-500 mx-auto mb-1" aria-hidden="true" /><span className="text-gray-400">Partiel</span><p className="font-bold text-gray-700">{formatCurrency(paymentStatus.fournisseurs.partial)}</p></div>
                  <div><div className="w-2 h-2 rounded-full bg-red-500 mx-auto mb-1" aria-hidden="true" /><span className="text-gray-400">Impayé</span><p className="font-bold text-gray-700">{formatCurrency(paymentStatus.fournisseurs.overdue)}</p></div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <SectionTitle icon={Boxes} title="État du Stock" action="Détail" onAction={handleNavigate('/dashboard/cons/stock')} />
            <div className="space-y-4 mt-2">
              {[
                { label: 'Produits en stock', value: stockSummary.totalProduits, color: 'bg-emerald-500' },
                { label: 'Stock critique', value: stockSummary.stockCritique, color: 'bg-red-500' },
                { label: 'Stock alerte', value: stockSummary.stockAlerte, color: 'bg-amber-500' },
                { label: 'Valeur totale', value: formatCurrency(stockSummary.valeurStock), color: 'bg-blue-500' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className={`w-10 h-10 rounded-lg ${item.color} flex items-center justify-center text-white`}>
                    <Package size={18} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-gray-700">{typeof item.value === 'number' ? item.value.toLocaleString('fr-FR') : item.value}</p>
                    <p className="text-xs text-gray-400">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2">Rotation par famille</p>
              <ProgressBar label="Médicaments" value={680} max={1000} color="bg-emerald-500" />
              <ProgressBar label="Parapharmacie" value={320} max={500} color="bg-blue-500" />
              <ProgressBar label="Matériel médical" value={145} max={300} color="bg-amber-500" />
              <ProgressBar label="Homéopathie" value={100} max={200} color="bg-violet-500" />
            </div>
          </div>
        </div>

        {/* RECENT INVOICES TABLE */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <SectionTitle icon={FileText} title="Dernières Factures Clients" action="Toutes" onAction={handleNavigate('/dashboard/vente/factures')} />
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th scope="col" className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">N° Facture</th>
                  <th scope="col" className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Client</th>
                  <th scope="col" className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Date</th>
                  <th scope="col" className="text-right py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Montant TTC</th>
                  <th scope="col" className="text-center py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Statut</th>
                  <th scope="col" className="text-right py-2 px-3 text-xs font-semibold text-gray-400 uppercase">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.filter(a => a.type === 'vente').map(inv => (
                  <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-gray-700">{inv.id}</td>
                    <td className="py-2.5 px-3 text-gray-500">{inv.entity}</td>
                    <td className="py-2.5 px-3 text-gray-400">{inv.date}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-700">{formatCurrency(inv.montant)}</td>
                    <td className="py-2.5 px-3 text-center"><span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">Facture</span></td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={handleNavigate('/dashboard/vente/factures')}
                        className="text-emerald-600 hover:text-emerald-700"
                        aria-label={`Voir détail ${inv.id}`}
                      >
                        <Eye size={16} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* DECISION AIDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={20} aria-hidden="true" />
              <h3 className="font-bold">Conseil du jour</h3>
            </div>
            <p className="text-sm opacity-90 leading-relaxed">Vos ventes sont en hausse de 12.5% ce mois. Profitez-en pour relancer les clients inactifs depuis 3 mois et augmenter votre panier moyen.</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={20} aria-hidden="true" />
              <h3 className="font-bold">Actions prioritaires</h3>
            </div>
            <ul className="text-sm opacity-90 space-y-1.5">
              <li className="flex items-center gap-2"><CheckCircle size={14} aria-hidden="true" /> Relancer 3 factures impayées</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} aria-hidden="true" /> Commander Paracétamol (stock critique)</li>
              <li className="flex items-center gap-2"><CheckCircle size={14} aria-hidden="true" /> Facturer 2 BL en attente</li>
            </ul>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={20} aria-hidden="true" />
              <h3 className="font-bold">Objectifs mensuels</h3>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1"><span>Ventes: 158,500 / 200,000 DH</span><span>79%</span></div>
                <div className="w-full bg-white/20 rounded-full h-2"><div className="bg-white h-2 rounded-full" style={{ width: '79%' }} /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1"><span>Recouvrement: 320,000 / 400,000 DH</span><span>80%</span></div>
                <div className="w-full bg-white/20 rounded-full h-2"><div className="bg-white h-2 rounded-full" style={{ width: '80%' }} /></div>
              </div>
            </div>
          </div>
        </div>

        {/* QUICK ACCESS */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <SectionTitle icon={Zap} title="Accès rapide" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {QUICK_BUTTONS.map(btn => (
              <button
                key={btn.path}
                onClick={handleNavigate(btn.path)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${btn.color}`}
                aria-label={btn.label}
              >
                <btn.icon size={24} aria-hidden="true" />
                <span className="text-xs font-medium">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};
