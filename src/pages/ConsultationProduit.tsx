import React, { useState, useEffect } from 'react';
import { CustomerDashboardLayout } from '../components/CustomerDashboardLayout';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Search, ShoppingCart, Plus, Minus, Trash2, Package, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

interface Product {
  id: string;
  code: string;
  name: string;
  sellPrice: number;
  buyPrice: number;
  stock: number;
}

interface CartItem extends Product {
  quantity: number;
}

export const ConsultationProduit: React.FC = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [selectedQty, setSelectedQty] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleValidateOrder = async () => {
    if (cart.length === 0) { toast('error', 'Panier vide'); return; }
    setSubmitting(true);
    try {
      await axios.post('/api/client/commandes', {
        items: cart.map(i => ({ productId: i.id, quantity: i.quantity, priceHT: i.sellPrice })),
      }, { headers: { Authorization: `Bearer ${token}` } });
      setCart([]);
      setShowCart(false);
      toast('success', "Commande envoyée avec succès !");
    } catch (err) {
      console.error("Erreur création commande:", err);
      toast('error', "Erreur lors de l'envoi de la commande");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    axios.get('/api/client/products', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        setProducts(res.data || []);
        if (res.data?.length > 0) {
          setSelectedProduct(res.data[0]);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [token]);

  const addProductToCart = (product: Product, qty: number = 1) => {
    if (product.stock <= 0) { toast('error', 'Stock épuisé'); return; }
    const toAdd = Math.min(qty, product.stock);
    const existingItem = cart.find(item => item.id === product.id);
    const totalAfter = (existingItem?.quantity || 0) + toAdd;
    if (totalAfter > product.stock) { toast('error', 'Stock insuffisant'); return; }
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: totalAfter }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: toAdd }]);
    }
    setShowCart(true);
    setSelectedQty(1);
    toast('success', `${product.name} ajouté au panier`);
  };

  const addToCart = () => {
    if (!selectedProduct) return;
    addProductToCart(selectedProduct, selectedQty);
  };

  const changeQty = (delta: number) => {
    setSelectedQty(Math.max(1, Math.min(selectedQty + delta, selectedProduct?.stock || 99)));
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
  };

  const currentIndex = selectedProduct ? filteredProducts.findIndex(p => p.id === selectedProduct.id) : -1;

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setSelectedProduct(filteredProducts[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (currentIndex < filteredProducts.length - 1) {
      setSelectedProduct(filteredProducts[currentIndex + 1]);
    }
  };

  return (
    <CustomerDashboardLayout>
      <div className="flex flex-col h-full gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-4">
            <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-lg font-bold text-sm whitespace-nowrap">
              {user?.name || 'PARA SOURCE'}
            </div>
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Rechercher un produit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            {selectedProduct && (
              <div className="text-sm text-gray-400 whitespace-nowrap">
                Produit {currentIndex + 1} sur {filteredProducts.length}
              </div>
            )}
            <button 
              onClick={() => setShowCart(!showCart)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors whitespace-nowrap"
            >
              <ShoppingCart size={18} />
              <span className="font-bold text-sm">Panier ({cartItemCount})</span>
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
            </div>
          ) : selectedProduct ? (
            <div className="h-full flex">
              <button
                onClick={goToPrevious}
                disabled={currentIndex <= 0}
                className="w-16 flex items-center justify-center border-r border-gray-100 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={32} className="text-slate-400" />
              </button>
              <div className="flex-1 p-8 overflow-y-auto">
                <div className=" mx-auto">
                  <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-700">{selectedProduct.name}</h2>
                    <p className="text-gray-400 mt-1">{selectedProduct.code}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                        <Package size={120} className="text-slate-300" />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-4 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-400">Action :</span>
                        <span className="text-sm font-bold text-gray-700">-</span>
                      </div>
                      <div className="flex items-center justify-between py-4 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-400">Code LACDP :</span>
                        <span className="text-sm font-bold text-gray-700">{selectedProduct.code}</span>
                      </div>
                      <div className="flex items-center justify-between py-4 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-400">PPH :</span>
                        <span className="text-sm font-bold text-purple-600">{selectedProduct.sellPrice.toFixed(2)} Dhs</span>
                      </div>
                      <div className="flex items-center justify-between py-4 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-400">Remise :</span>
                        <span className="text-sm font-bold text-gray-700">- %</span>
                      </div>
                      <div className="flex items-center justify-between py-4 border-b border-gray-100">
                        <span className="text-sm font-semibold text-gray-400">Votre prix :</span>
                        <span className="text-xl font-bold text-purple-600">{selectedProduct.sellPrice.toFixed(2)} Dhs</span>
                      </div>
                      <div className="pt-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center border border-gray-200 rounded-lg bg-white">
                            <button onClick={() => changeQty(-1)} className="p-3 hover:bg-gray-100 transition-colors">
                              <Minus size={18} />
                            </button>
                            <span className="px-6 font-bold text-lg">{selectedQty}</span>
                            <button onClick={() => changeQty(1)} className="p-3 hover:bg-gray-100 transition-colors">
                              <Plus size={18} />
                            </button>
                          </div>
                          <button 
                            onClick={addToCart}
                            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity text-lg"
                          >
                            <ShoppingCart size={20} />
                            Ajouter à votre bon de commande
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={goToNext}
                disabled={currentIndex >= filteredProducts.length - 1}
                className="w-16 flex items-center justify-center border-l border-gray-100 hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight size={32} className="text-slate-400" />
              </button>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400">
              <p className="text-lg">
                {searchQuery ? 'Aucun produit trouvé' : 'Recherchez un produit pour commencer'}
              </p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {showCart && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed right-4 top-20 bottom-4 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col z-50"
            >
              <div className="p-4 border-b border-gray-100 bg-gradient-to-r from-purple-600 to-pink-500">
                <div className="flex items-center justify-between text-white">
                  <h3 className="font-bold flex items-center gap-2">
                    <ShoppingCart size={18} />
                    Votre Commande
                  </h3>
                  <button onClick={() => setShowCart(false)} className="opacity-80 hover:opacity-100 text-2xl">×</button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center text-slate-400 py-8">
                    <ShoppingCart size={48} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Votre panier est vide</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div key={item.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-sm text-gray-700">{item.name}</p>
                            <p className="text-xs text-gray-400">{item.code}</p>
                          </div>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="font-bold text-sm w-6 text-center">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <p className="font-bold text-purple-600 text-sm">
                            {(item.sellPrice * item.quantity).toFixed(2)} Dhs
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {cart.length > 0 && (
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-bold text-gray-600">Total</span>
                    <span className="font-bold text-xl text-purple-600">{cartTotal.toFixed(2)} Dhs</span>
                  </div>
                  <button onClick={handleValidateOrder} disabled={submitting} className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
                    {submitting ? "Envoi en cours..." : "Valider la commande"}
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </CustomerDashboardLayout>
  );
};
