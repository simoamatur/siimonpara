import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, error, icon, className, id, ...props }) => {
  const inputId = id || React.useId();
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-500 transition-colors">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={clsx(
            'w-full bg-gray-50 dark:bg-gray-800 border rounded-xl py-2.5 text-sm text-gray-700 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900 transition-all duration-300',
            icon ? 'pl-10 pr-4' : 'px-4',
            error
              ? 'border-rose-300 dark:border-rose-700 focus:border-rose-400'
              : 'border-gray-200 dark:border-gray-700 focus:border-emerald-400 dark:focus:border-emerald-600',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-500 ml-1">{error}</p>}
    </div>
  );
};
