import { describe, it, expect, beforeEach } from "vitest";
import { useCart } from "@/lib/cart-store";

const productA = { productId: "00000000-0000-0000-0000-000000000001", quantity: 1 };
const productB = { productId: "00000000-0000-0000-0000-000000000002", quantity: 2 };
const variantA = {
  productId: "00000000-0000-0000-0000-000000000001",
  variantId: "00000000-0000-0000-0000-000000000003",
  quantity: 1,
};

describe("cart store", () => {
  beforeEach(() => {
    useCart.setState({ items: [] });
  });

  it("adds a new item", () => {
    useCart.getState().addItem(productA);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0]).toEqual(productA);
  });

  it("increments quantity for the same product + variant", () => {
    useCart.getState().addItem(productA);
    useCart.getState().addItem({ ...productA, quantity: 2 });
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].quantity).toBe(3);
  });

  it("keeps separate entries for different variants", () => {
    useCart.getState().addItem(productA);
    useCart.getState().addItem(variantA);
    expect(useCart.getState().items).toHaveLength(2);
  });

  it("removes an item", () => {
    useCart.getState().addItem(productA);
    useCart.getState().addItem(productB);
    useCart.getState().removeItem(productA.productId);
    expect(useCart.getState().items).toHaveLength(1);
    expect(useCart.getState().items[0].productId).toBe(productB.productId);
  });

  it("updates quantity", () => {
    useCart.getState().addItem(productA);
    useCart.getState().updateQuantity(productA.productId, undefined, 5);
    expect(useCart.getState().items[0].quantity).toBe(5);
  });

  it("removes item when quantity is set to zero or negative", () => {
    useCart.getState().addItem(productA);
    useCart.getState().updateQuantity(productA.productId, undefined, 0);
    expect(useCart.getState().items).toHaveLength(0);
  });

  it("clears the cart", () => {
    useCart.getState().addItem(productA);
    useCart.getState().addItem(productB);
    useCart.getState().clearCart();
    expect(useCart.getState().items).toHaveLength(0);
  });

  it("counts total items", () => {
    useCart.getState().addItem(productA);
    useCart.getState().addItem(productB);
    expect(useCart.getState().getItemCount()).toBe(3);
  });

  it("rejects invalid quantities", () => {
    useCart.getState().addItem({ ...productA, quantity: 0 });
    expect(useCart.getState().items).toHaveLength(0);
  });
});
