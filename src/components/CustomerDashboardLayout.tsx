/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  User,
  ChevronRight,
  ChevronDown,
  Search,
  ShoppingCart,
  ClipboardList,
  Tag,
  MessageCircle,
  LogOut,
  UserCircle,
  Settings,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

// Composant Logo SIMOnPARA avec le "n" stylisé
const SIMOnPARALogo: React.FC<{ onAdminClick?: () => void; clickCount: number }> = ({ onAdminClick, clickCount }) => {
  const [clicks, setClicks] = useState(0);
  const [showHint, setShowHint] = useState(false);
  
  const handleClick = () => {
    const newClicks = clicks + 1;
    setClicks(newClicks);
    
    if (newClicks >= 5) {
      onAdminClick?.();
      setClicks(0);
    } else if (newClicks === 3) {
      setShowHint(true);
      setTimeout(() => setShowHint(false), 2000);
    }
  };

  return (
    <div className="relative">
      <div 
        onClick={handleClick}
        className="cursor-pointer select-none flex items-center gap-1"
      >
        <span className="text-2xl font-black tracking-tight text-gray-700">
          SIMO
        </span>
        <span className="text-2xl font-black tracking-tight relative">
          <span className="text-transparent bg-clip-text bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 drop-shadow-lg"
                style={{ 
                  textShadow: '2px 2px 4px rgba(147, 51, 234, 0.3)',
                  fontFamily: 'serif',
                  fontStyle: 'italic',
                  letterSpacing: '-0.05em'
                }}>
            n
          </span>
        </span>
        <span className="text-2xl font-black tracking-tight text-gray-700">
          PARA
        </span>
      </div>
      <p className="text-[11px] font-bold tracking-wider text-purple-600 uppercase mt-1">
        Votre Beauté, Notre Passion
      </p>
      
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute -top-8 left-0 bg-purple-600 text-white text-[10px] px-2 py-1 rounded font-bold whitespace-nowrap"
          >
            {5 - clicks} clics pour mode admin
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface MenuItem {
  name: string;
  icon: React.ReactNode;
  path?: string;
  submenu?: { name: string; path: string }[];
}

export const CustomerDashboardLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    'Mon compte': false,
    'Espace clients': true
  });
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const toggleMenu = (name: string) => {
    setOpenMenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const handleAdminSwitch = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    setShowUserDropdown(false);
    logout();
  };

  const menuItems: MenuItem[] = [
    { 
      name: 'Mon compte', 
      icon: <User size={20} />,
      submenu: [
        { name: 'Mon Profile', path: '/client/profile' }
      ]
    },
    { 
      name: 'Espace clients', 
      icon: <Settings size={20} />,
      submenu: [
        { name: 'Consultation Produit', path: '/client/consultation' },
        { name: 'Ma Commande', path: '/client/commande' },
        { name: 'Mes Commandes Que j\'ai passé', path: '/client/mes-commandes' },
        { name: 'Promotion', path: '/client/promotions' },
        { name: 'Contacter Simo', path: '/client/contact' }
      ]
    }
  ];

  // Déterminer le titre de la page actuelle
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/consultation')) return 'Consultation Produit';
    if (path.includes('/profile')) return 'Mon Profile';
    if (path.includes('/commande')) return 'Ma Commande';
    if (path.includes('/mes-commandes')) return 'Mes Commandes';
    if (path.includes('/promotions')) return 'Promotions';
    if (path.includes('/contact')) return 'Contacter Simo';
    return 'Consultation Produit';
  };

  return (
    <div className="flex h-screen bg-[#f5f5f0] font-sans text-gray-700">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
        {/* Logo */}
        <div className="p-6 border-b border-gray-100">
          <SIMOnPARALogo onAdminClick={handleAdminSwitch} clickCount={clickCount} />
        </div>

        {/* Menu */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isSubOpen = item.submenu && openMenus[item.name];
            
            const content = (
              <div className={`flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer ${
                isSubOpen ? 'bg-purple-50' : 'hover:bg-gray-50'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`transition-colors ${isSubOpen ? 'text-purple-600' : 'text-gray-400'}`}>
                    {item.icon}
                  </div>
                  <span className={`text-sm font-semibold transition-colors ${
                    isSubOpen ? 'text-purple-700' : 'text-gray-600'
                  }`}>
                    {item.name}
                  </span>
                </div>
                {item.submenu && (
                  <ChevronRight 
                    size={16} 
                    className={`transition-transform duration-200 ${
                      isSubOpen ? 'rotate-90 text-purple-600' : 'text-slate-400'
                    }`} 
                  />
                )}
              </div>
            );

            return (
              <div key={item.name}>
                {item.submenu ? (
                  <button onClick={() => toggleMenu(item.name)} className="w-full text-left">
                    {content}
                  </button>
                ) : (
                  <Link to={item.path || '#'}>
                    {content}
                  </Link>
                )}
                <AnimatePresence>
                  {item.submenu && isSubOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-9 mt-1 space-y-1 border-l-2 border-purple-100 pl-3">
                        {item.submenu.map(sub => (
                          <Link 
                            key={sub.name} 
                            to={sub.path}
                            className={`w-full text-left block p-2 rounded-md text-sm font-medium transition-all ${
                              location.pathname === sub.path
                                ? 'text-purple-700 bg-purple-50 font-bold' 
                                : 'text-gray-400 hover:text-purple-600 hover:bg-purple-50/50'
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

        {/* Footer */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
              {user?.name?.[0] || 'C'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate text-gray-600">{user?.name || 'Client'}</p>
              <p className="text-[10px] text-purple-600 uppercase font-bold">Client</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Link 
              to="/client/consultation" 
              className={`text-sm font-bold uppercase tracking-wide transition-colors ${
                location.pathname === '/client/consultation' 
                  ? 'text-purple-700' 
                  : 'text-gray-500 hover:text-purple-600'
              }`}
            >
              CONSULTATION PRODUIT
            </Link>
            <ArrowRight size={16} className="text-slate-400" />
            <span className="text-sm font-bold text-gray-700">{getPageTitle()}</span>
          </div>

          <div className="flex items-center gap-4">
            {/* User Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-bold text-gray-600">
                  {user?.name || 'PARA SOURCE'}
                </span>
                <ChevronDown size={16} className={`transition-transform ${showUserDropdown ? 'rotate-180' : ''} text-gray-400`} />
              </button>

              <AnimatePresence>
                {showUserDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-xs font-bold text-gray-600 truncate">{user?.name}</p>
                      <p className="text-[10px] text-gray-400">{user?.email}</p>
                    </div>
                    <Link 
                      to="/client/profile"
                      onClick={() => setShowUserDropdown(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                    >
                      <UserCircle size={16} />
                      Mon Profile
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    >
                      <LogOut size={16} />
                      Se déconnecter
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};
