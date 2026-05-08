/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product } from './types';

export const CATEGORIES = ['All', 'Skincare', 'Health', 'Beauty', 'Baby', 'Sun Care'] as const;

export const PRODUCTS: Product[] = [
  {
    id: '1',
    code: 'SK001',
    name: 'Hydrating Face Cream',
    brand: 'Eau Thermale',
    sellPrice: 24.99,
    tva: 20,
    stock: 50,
    unit: 'Unité'
  },
  {
    id: '2',
    code: 'BE001',
    name: 'Vitamin C Serum',
    brand: 'Pure Essence',
    sellPrice: 35.50,
    tva: 20,
    stock: 42,
    unit: 'Unité'
  },
  {
    id: '3',
    code: 'BA001',
    name: 'Gentle Baby Wash',
    brand: 'Soft Care',
    sellPrice: 15.99,
    tva: 20,
    stock: 120,
    unit: 'Unité'
  },
  {
    id: '4',
    code: 'SU001',
    name: 'Invisible Sunscreen SPF 50+',
    brand: 'Solar Shield',
    sellPrice: 21.00,
    tva: 20,
    stock: 85,
    unit: 'Unité'
  }
];
