"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "@/types";

type CartState = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
};

function validateQuantity(quantity: number): boolean {
  return Number.isInteger(quantity) && quantity > 0;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        if (!validateQuantity(item.quantity)) {
          console.error("Invalid cart item quantity", item);
          return;
        }

        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) =>
              i.productId === item.productId && i.variantId === item.variantId
          );

          if (existingIndex >= 0) {
            const updated = [...state.items];
            const newQuantity = updated[existingIndex].quantity + item.quantity;
            if (!validateQuantity(newQuantity)) {
              console.error("Invalid resulting cart quantity", newQuantity);
              return state;
            }
            updated[existingIndex] = {
              ...updated[existingIndex],
              quantity: newQuantity,
            };
            return { items: updated };
          }

          return { items: [...state.items, item] };
        });
      },

      removeItem: (productId, variantId) => {
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(
                i.productId === productId &&
                (variantId === undefined
                  ? i.variantId === undefined
                  : i.variantId === variantId)
              )
          ),
        }));
      },

      updateQuantity: (productId, variantId, quantity) => {
        if (!validateQuantity(quantity)) {
          set((state) => ({
            items: state.items.filter(
              (i) =>
                !(
                  i.productId === productId &&
                  i.variantId === variantId
                )
            ),
          }));
          return;
        }

        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      getItemCount: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },
    }),
    {
      name: "bioliz-cart",
    }
  )
);
