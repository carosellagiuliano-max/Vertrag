import { describe, expect, test, vi, beforeEach } from "vitest";
import * as shopService from "../../features/shop/shop-service";
import * as demoStore from "../../features/shop/demo-store";
import Stripe from "stripe";
import { getServiceRoleClient } from "../../lib/supabase/admin";
import { cookies } from "next/headers";
import { demoProducts } from "../../features/shop/products";

vi.mock("../../features/shop/demo-store");
vi.mock("../../lib/supabase/admin");
vi.mock("next/headers");
vi.mock("stripe");

const mockReserveDemoStock = demoStore.reserveDemoStock as vi.Mock;
const mockListDemoProducts = demoStore.listDemoProducts as vi.Mock;
const mockGetDemoProductBySlug = demoStore.getDemoProductBySlug as vi.Mock;
const mockListDemoOrders = demoStore.listDemoOrders as vi.Mock;
const mockCreateDemoOrder = demoStore.createDemoOrder as vi.Mock;

const mockGetServiceRoleClient = getServiceRoleClient as vi.Mock;
const mockStripe = Stripe as vi.MockedClass<typeof Stripe>;
const mockCookies = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  process.env.USE_DEMO = "true";
  (cookies as vi.Mock).mockReturnValue({
    get: vi.fn().mockReturnValue(undefined),
    set: vi.fn(),
    delete: vi.fn(),
  } as any);
});

describe("shop-service", () => {
  test("getCart empty", () => {
    const cart = shopService.getCart();
    expect(cart).toEqual([]);
  });

  test("addToCart updates cookie", () => {
    const lines: any[] = [{ productId: "p1", quantity: 1 }];
    const mockWrite = vi.fn();
    const mockRead = vi.fn().mockReturnValue(lines);
    // Mock private functions if possible, but test public
    const updated = shopService.addToCart(lines, { productId: "p2", quantity: 2 });
    expect(updated).toHaveLength(2);
    expect((cookies as vi.Mock)().set).toHaveBeenCalled();
  });

  test("removeFromCart clears item", () => {
    const lines = [{ productId: "p1", quantity: 1 }];
    mockCookies().get = vi.fn().mockReturnValue({ value: JSON.stringify(lines) });
    const result = shopService.removeFromCart(lines, "p1");
    expect(result).toEqual([]);
    expect((cookies as vi.Mock)().set).toHaveBeenCalled();
  });

  test("clearCart deletes cookie", () => {
    shopService.clearCart();
    expect((cookies as vi.Mock)().delete).toHaveBeenCalledWith("shop-cart");
  });

  test("getCartDetails demo products", async () => {
    const lines = [{ productId: demoProducts[0].id, quantity: 1 }];
    mockCookies().get = vi.fn().mockReturnValue({ value: JSON.stringify(lines) });
    mockListDemoProducts.mockResolvedValue(demoProducts);

    const details = await shopService.getCartDetails();
    expect(details.lines).toHaveLength(1);
    expect(details.total).toBe(demoProducts[0].priceChf);
  });

  test("listProducts demo", async () => {
    mockListDemoProducts.mockResolvedValue(demoProducts);
    const products = await shopService.listProducts();
    expect(products).toEqual(demoProducts);
  });

  test("getProductBySlug demo", async () => {
    const product = demoProducts[0];
    mockGetDemoProductBySlug.mockResolvedValue(product);
    const found = await shopService.getProductBySlug(product.slug);
    expect(found).toEqual(product);
  });

  test("placeOrder demo empty cart fails", async () => {
    const result = await shopService.placeOrder({ email: "test@example.com", lines: [] });
    expect(result.ok).toBe(false);
    expect(result.message).toBe("Warenkorb leer");
  });

  test("placeOrder demo success", async () => {
    const lines = [{ productId: demoProducts[0].id, quantity: 1 }];
    const mockOrder = { id: "ord1", totalChf: 100 };
    mockCreateDemoOrder.mockReturnValue(mockOrder);
    mockReserveDemoStock.mockReturnValue(undefined);

    const result = await shopService.placeOrder({
      email: "test@example.com",
      lines,
    });

    expect(result.ok).toBe(true);
    expect(result.orderId).toBe("ord1");
    expect(shopService.clearCart).toHaveBeenCalled();
  });

  test("placeOrder real stock check fails", async () => {
    process.env.USE_DEMO = "false";
    const lines = [{ productId: "p1", quantity: 10 }];
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ data: [{ id: "p1", product_stock: { stock_on_hand: 5 } }] }),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      })),
    };
    mockGetServiceRoleClient.mockReturnValue(mockClient as any);

    const result = await shopService.placeOrder({ email: "test@example.com", lines });
    expect(result.ok).toBe(false);
    expect(result.message).toContain("Nur 5x verfügbar");
  });

  test("loadOrders demo", async () => {
    mockListDemoOrders.mockReturnValue([{ id: "ord1", totalChf: 100 }]);
    const orders = await shopService.loadOrders("test@example.com");
    expect(orders).toHaveLength(1);
  });
});