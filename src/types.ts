/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface Client {
  id: string;
  code: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  brand: string;
  sellPrice: number;
  tva: number;
  stock: number;
  unit: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface BonLivraisonItem {
  id?: string;
  productId: string;
  product?: Product;
  quantity: number;
  priceHT: number;
  discount: number;
  tva: number;
  totalHT: number;
  totalTTC: number;
}

export interface BonLivraison {
  id: string;
  reference: string;
  date: string;
  clientId: string;
  client?: Client;
  user?: User;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  validated: boolean;
  printedCount: number;
  paymentMode: string;
  items?: BonLivraisonItem[];
}

