/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Star, Plus } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {product.isNew && (
          <span className="absolute top-4 left-4 bg-brand-primary text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
            Nouveau
          </span>
        )}
        {product.isBestSeller && !product.isNew && (
          <span className="absolute top-4 left-4 bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
            Best Seller
          </span>
        )}
        <button 
          onClick={() => onAddToCart(product)}
          className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-brand-primary p-3 rounded-full shadow-lg opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-brand-primary hover:text-white"
        >
          <Plus size={20} />
        </button>
      </div>

      <div className="p-5">
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i} 
              size={12} 
              className={i < Math.floor(product.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"} 
            />
          ))}
          <span className="text-[10px] text-slate-400 font-medium ml-1">{product.rating}</span>
        </div>
        
        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-bold mb-1">{product.brand}</p>
        <h3 className="font-serif text-lg leading-snug mb-2 group-hover:text-brand-primary transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold text-gray-700">{product.price.toFixed(2)} €</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-widest">{product.category}</span>
        </div>
      </div>
    </motion.div>
  );
};
