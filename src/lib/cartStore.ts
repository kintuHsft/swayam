import { create } from 'zustand';
import { CartItem } from '@/types';
import { nanoid } from "nanoid";

interface CartState {
  cart: CartItem[];
  addItem: (item: Omit<CartItem, "entryId">) => void;
  removeItem: (entryId: string) => void;
  updateItem: (entryId: string, item: CartItem) => void;
  clearCart: () => void;
  totalAmount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: [],

  addItem: (item) =>
    set((state) => ({
      cart: [...state.cart, { ...item, entryId: nanoid() }],
    })),
  updateItem: (entryId, updatedFields) =>
    set((state) => ({
      cart: state.cart.map((item) =>
        item.entryId === entryId ? { ...item, ...updatedFields } : item
      ),
    })),

  removeItem: (entryId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.entryId !== entryId),
    })),
  clearCart: () => set({ cart: [] }),

  totalAmount: () => {
    const cart = get().cart;
    return cart.reduce((acc, item) => acc + parseFloat(String(item.amount || 0)), 0);

  },
}));