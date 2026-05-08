/**
 * Dashboard Layout - Modern 2026 Design
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useCallback } from 'react';
import {
  BarChart3,
  ShoppingBag,
  Truck,
  Package,
  Settings,
  LogOut,
  ChevronRight,
  Search,
  Bell,
  User,
  Menu,
  X,
  Sun,
  Moon,
  Leaf,
  Sparkles,
  Download,
  WifiOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePWA, useNetworkStatus } from '../hooks/usePWA';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
}

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  submenu?: { name: string; path: string }[];
}

const MENU_ITEMS: MenuItem[] = [
  { name: 'Tableau de bord', icon: <BarChart3 size={22} />, path: 'dashboard' },
  {
    name: 'Ventes',
    icon: <ShoppingBag size={22} />,
    submenu: [
      { name: 'Bons de Livraison', path: 'vente/bon-livraison' },
      { name: 'Factures Clients', path: 'vente/factures' },
      { name: 'Bon retour', path: 'vente/retour' },
      { name: 'Bon avoir', path: 'vente/avoir' },
      { name: 'Règlement', path: 'vente/paiement' },
      { name: 'Facture Automatique', path: 'vente/facture-auto' },
      { name: 'Suivi de livraison', path: 'vente/suivi' },
    ]
  },
  {
    name: 'Achats',
    icon: <Truck size={22} />,
    submenu: [
      { name: 'Demande de prix', path: 'achat/demande-prix' },
      { name: 'Bon de réception', path: 'achat/reception' },
      { name: 'Facture fournisseur', path: 'achat/factures' },
      { name: 'Retour fournisseur', path: 'achat/retours' },
      { name: 'Avoir fournisseur', path: 'achat/avoirs' },
      { name: 'Règlement fournisseur', path: 'achat/reglements' },
    ]
  },
  {
    name: 'Stocks',
    icon: <Package size={22} />,
    submenu: [
      { name: 'Inventaire', path: 'stock/inventaire' },
      { name: 'Mouvement de stock', path: 'stock/mouvement' },
    ]
  },
  {
    name: 'Consultation',
    icon: <Search size={22} />,
    submenu: [
      { name: 'Etat de stock', path: 'cons/stock' },
      { name: 'Journal des ventes', path: 'cons/ventes' },
      { name: 'Relevé client', path: 'cons/releve' },
    ]
  },
  {
    name: 'Paramétrage',
    icon: <Settings size={22} />,
    submenu: [
      { name: 'Clients', path: 'param/clients' },
      { name: 'Fournisseurs', path: 'param/fournisseurs' },
      { name: 'Produits', path: 'param/produits' },
      { name: 'Articles & nomenclature', path: 'param/nomenclature' },
      { name: 'Promotions', path: 'param/promotions' },
      { name: 'TVA', path: 'param/tva' },
      { name: 'Users', path: 'param/users' },
      { name: 'Roles (RBAC)', path: 'param/roles' },
      { name: 'Livreurs', path: 'param/livreurs' },
      { name: 'Catégories', path: 'param/cat-client' },
      { name: 'Zones', path: 'param/zone' },
      { name: 'Villes', path: 'param/ville' },
      { name: 'Group remise', path: 'param/group-remise' },
      { name: 'Dépôts', path: 'param/depot' },
      { name: 'Familles', path: 'param/famille' },
      { name: 'Sous familles', path: 'param/sous-famille' },
      { name: 'Modes de Règlement', path: 'param/mode-paiement' },
    ]
  },
];

type Theme = 'light' | 'dark' | 'warm';

const THEME_CONFIG: Record<Theme, { bg: string; darkBg: string; icon: typeof Sun; color: string }> = {
  light: { bg: 'bg-[#F5F9F7]', darkBg: 'dark:bg-gray-950', icon: Sun, color: 'text-amber-500' },
  dark: { bg: 'bg-gray-950', darkBg: 'dark:bg-gray-950', icon: Moon, color: 'text-indigo-400' },
  warm: { bg: 'bg-[#FAF8F5]', darkBg: 'dark:bg-stone-900', icon: Leaf, color: 'text-amber-600' },
};

export const DashboardLayout: React.FC<LayoutProps> = ({ children, title }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<Theme>('light');
  const isDark = theme === 'dark';
  const isWarm = theme === 'warm';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isInstallable, isOffline, install, updateAvailable, update } = usePWA();
  const { isOnline } = useNetworkStatus();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    MENU_ITEMS.forEach(item => {
      if (item.submenu) {
        initial[item.name] = item.submenu.some(sub => location.pathname.includes(sub.path));
      }
    });
    return initial;
  });

  const toggleMenu = useCallback((name: string) => {
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  const handleSwitchToClient = useCallback(() => {
    navigate('/client/consultation');
  }, [navigate]);

  return (
    <div className={`flex h-screen font-sans transition-colors duration-300 ${isDark ? 'dark bg-gray-950' : isWarm ? 'bg-[#FAF8F5]' : 'bg-[#F5F9F7]'}`}>
      {/* Glassmorphism Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className={`fixed lg:relative z-50 w-72 h-full backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-r border-white/20 dark:border-gray-800/50 flex flex-col shadow-2xl ${!sidebarOpen && 'hidden lg:flex'}`}
          >
            {/* Logo Area */}
            <div className="p-6 border-b border-gray-100/50 dark:border-gray-800/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="font-bold text-xl tracking-tight text-emerald-600">
                    SIMOnPARA
                  </h1>
                  <p className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">
                    ERP 2026
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-hide">
              {MENU_ITEMS.map((item) => {
                const isOpen = openMenus[item.name];
                const isActive = item.path
                  ? location.pathname === (item.path === 'dashboard' ? '/dashboard' : `/dashboard/${item.path}`)
                  : item.submenu?.some(sub => location.pathname.includes(sub.path));

                return (
                  <div key={item.name} className="mb-1">
                    <button
                      onClick={() => item.submenu ? toggleMenu(item.name) : navigate(item.path === 'dashboard' ? '/dashboard' : `/dashboard/${item.path}`)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                          : 'hover:bg-white/60 dark:hover:bg-gray-800/60 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-emerald-500 transition-colors'}>
                          {item.icon}
                        </span>
                        <span className="font-medium text-sm">{item.name}</span>
                      </div>
                      {item.submenu && (
                        <ChevronRight
                          size={16}
                          className={`transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`}
                        />
                      )}
                    </button>

                    <AnimatePresence>
                      {item.submenu && isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden ml-4 mt-1"
                        >
                          <div className="border-l-2 border-emerald-200 dark:border-emerald-800 pl-4 space-y-1 py-1">
                            {item.submenu.map(sub => (
                              <Link
                                key={sub.name}
                                to={`/dashboard/${sub.path}`}
                                className={`block px-4 py-2 rounded-lg text-sm transition-all ${
                                  location.pathname.includes(sub.path)
                                    ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold'
                                    : 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20'
                                }`}
                              >
                                {sub.name}
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>

            {/* User Section */}
            <div className="p-4 border-t border-gray-100/50 dark:border-gray-800/50">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-700 dark:text-white truncate">
                    {user?.name || 'Admin'}
                  </p>
                  <p className="text-[10px] text-emerald-500 font-medium uppercase tracking-wider">
                    {user?.role || 'ADMIN'}
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="w-full mt-3 flex items-center justify-center gap-2 p-3 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all group"
              >
                <LogOut size={18} className="group-hover:rotate-12 transition-transform" />
                <span className="font-medium text-sm">Déconnexion</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Modern Glassmorphism Header */}
        <header className="h-20 backdrop-blur-xl bg-white/70 dark:bg-gray-900/70 border-b border-white/50 dark:border-gray-800/50 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:flex hidden w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 flex items-center justify-center transition-all"
            >
              <Menu size={20} className="text-gray-600 dark:text-gray-400" />
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
            >
              <Menu size={20} />
            </button>

            <div>
              <h1 className="text-xl font-bold text-gray-700 dark:text-white">
                {title}
              </h1>
              <p className="text-xs text-gray-400">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Offline Indicator */}
            {!isOnline && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                <WifiOff size={16} />
                <span className="text-sm font-medium hidden sm:inline">Hors ligne</span>
              </div>
            )}

            {/* PWA Install Button */}
            {isInstallable && (
              <button
                onClick={install}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all"
                title="Installer l'application"
              >
                <Download size={18} />
                <span className="text-sm font-medium hidden sm:inline">Installer</span>
              </button>
            )}

            {/* Update Available Badge */}
            {updateAvailable && (
              <button
                onClick={update}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-all"
              >
                <Sparkles size={16} />
                <span className="text-sm font-medium hidden sm:inline">Mise à jour</span>
              </button>
            )}

            {/* Theme Selector - 3 modes */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
              {(['light', 'dark', 'warm'] as Theme[]).map((t) => {
                const Icon = THEME_CONFIG[t].icon;
                const isActive = theme === t;
                return (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                      isActive ? 'bg-white dark:bg-gray-700 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    title={t === 'light' ? 'Mode Clair' : t === 'dark' ? 'Mode Sombre' : 'Mode Nature'}
                  >
                    <Icon size={16} className={isActive ? THEME_CONFIG[t].color : 'text-gray-400 dark:text-gray-500'} />
                  </button>
                );
              })}
            </div>

            <button className="relative w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 flex items-center justify-center transition-all">
              <Bell size={18} className="text-gray-600 dark:text-gray-400" />
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-white text-[10px] font-bold flex items-center justify-center shadow-lg">
                3
              </span>
            </button>

            <button
              onClick={handleSwitchToClient}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5"
            >
              <User size={18} />
              <span className="text-sm">Espace Client</span>
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-emerald-200 dark:scrollbar-thumb-slate-700">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            {children}
          </motion.div>
        </div>
      </main>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 z-50 lg:hidden overflow-y-auto"
            >
              {/* Mobile menu content - similar to sidebar */}
              <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
                <span className="font-bold text-lg text-emerald-600">SIMOnPARA</span>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
              <nav className="p-4">
                {MENU_ITEMS.map(item => (
                  <div key={item.name} className="mb-2">
                    <button
                      onClick={() => {
                        if (item.path) {
                          navigate(`/dashboard/${item.path}`);
                          setMobileMenuOpen(false);
                        } else {
                          toggleMenu(item.name);
                        }
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl text-gray-600 hover:bg-emerald-50"
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.name}</span>
                      </div>
                      {item.submenu && <ChevronRight size={16} />}
                    </button>
                    {item.submenu?.map(sub => (
                      <Link
                        key={sub.name}
                        to={`/dashboard/${sub.path}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block pl-10 py-2 text-sm text-gray-500"
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
