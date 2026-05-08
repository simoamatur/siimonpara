/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShoppingBag, Search, User, Menu } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, onOpenCart }) => {
  return (
    <nav className="sticky top-0 z-50 bg-paper/80 backdrop-blur-md border-b border-gray-200">
      <div className="w-full px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="p-2 lg:hidden">
            <Menu size={24} />
          </button>
          <div className="flex flex-col">
            <span className="text-2xl font-serif font-bold tracking-tight text-brand-primary leading-none">
              Siimon-Para
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-sans font-medium">
              Boutique Santé & Beauté
            </span>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-8">
          <a href="#" className="text-sm font-medium hover:text-brand-primary transition-colors">Accueil</a>
          <a href="#" className="text-sm font-medium hover:text-brand-primary transition-colors">Boutique</a>
          <a href="#" className="text-sm font-medium hover:text-brand-primary transition-colors">À Propos</a>
          <a href="#" className="text-sm font-medium hover:text-brand-primary transition-colors">Contact</a>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button className="p-2 text-gray-500 hover:text-brand-primary transition-colors">
            <Search size={20} />
          </button>
          <button className="p-2 text-gray-500 hover:text-brand-primary transition-colors hidden sm:block">
            <User size={20} />
          </button>
          <button 
            onClick={onOpenCart}
            className="p-2 text-gray-500 hover:text-brand-primary transition-colors relative"
          >
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <motion.span 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-0 right-0 bg-brand-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
              >
                {cartCount}
              </motion.span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
};
