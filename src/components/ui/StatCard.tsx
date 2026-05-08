import React from 'react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; positive: boolean };
  color?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, trend, color = 'from-emerald-500 to-teal-500', className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={clsx('bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow', className)}
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
        {trend && (
          <p className={clsx('text-xs font-medium mt-1', trend.positive ? 'text-emerald-600' : 'text-rose-600')}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </p>
        )}
      </div>
      <div className={clsx('w-12 h-12 rounded-xl bg-gradient-to-br', color, 'flex items-center justify-center text-white shadow-lg')}>
        {icon}
      </div>
    </div>
  </motion.div>
);
