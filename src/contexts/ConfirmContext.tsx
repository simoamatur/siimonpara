import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType>({ confirm: () => Promise.resolve(false) });

export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<{ options: ConfirmOptions; resolve: (v: boolean) => void } | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ options, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    state?.resolve(result);
    setState(null);
  };

  const isDanger = state?.options.variant !== 'warning';
  const accentColor = isDanger ? 'from-rose-500 to-red-500' : 'from-amber-500 to-orange-500';
  const shadowColor = isDanger ? 'shadow-red-500/25' : 'shadow-amber-500/25';

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <AnimatePresence>
        {state && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => handleClose(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm mx-4 overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className={`w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${accentColor} flex items-center justify-center shadow-lg ${shadowColor}`}>
                  <AlertTriangle className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  {state.options.title || (isDanger ? 'Confirmer la suppression' : 'Confirmer')}
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  {state.options.message}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleClose(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium text-sm transition-all"
                  >
                    {state.options.cancelText || 'Annuler'}
                  </button>
                  <button
                    onClick={() => handleClose(true)}
                    className={`flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r ${accentColor} text-white font-medium shadow-lg ${shadowColor} hover:opacity-90 transition-all text-sm`}
                  >
                    {state.options.confirmText || (isDanger ? 'Supprimer' : 'Confirmer')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
};
