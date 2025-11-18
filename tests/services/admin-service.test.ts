import { describe, expect, test, vi, beforeEach } from "vitest";
import * as adminService from "../../features/admin/admin-service";
import { demoAdminData } from "../../features/admin/demo-data";
import { getServiceRoleClient } from "../../lib/supabase/admin";
import { env } from "../../lib/config/env";

vi.mock("../../lib/supabase/admin");
vi.mock("../../lib/config/env", () => ({
  env: { adminEmail: "admin@example.com", defaultSalonId: "salon1", defaultStaffId: "staff1" },
}));

const mockGetServiceRoleClient = getServiceRoleClient as vi.Mock;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.USE_DEMO = "true";
});

describe("admin-service", () => {
  test("isAdminEmail true for matching", () => {
    expect(adminService.isAdminEmail("admin@example.com")).toBe(true);
    expect(adminService.isAdminEmail("ADMIN@EXAMPLE.COM")).toBe(true);
  });

  test("isAdminEmail false for non-matching", () => {
    expect(adminService.isAdminEmail("user@example.com")).toBe(false);
    expect(adminService.isAdminEmail("")).toBe(false);
    expect(adminService.isAdminEmail(null)).toBe(false);
  });

  test("loadAdminDashboard demo mode", async () => {
    const dashboard = await adminService.loadAdminDashboard();
    expect(dashboard).toEqual(demoAdminData);
  });

  test("loadAdminDashboard real mode mocks", async () => {
    process.env.USE_DEMO = "false";
    const mockClient = {
      from: vi.fn(() => ({
        select: vi.fn().mockResolvedValue({ data: [] }),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      })),
    };
    mockGetServiceRoleClient.mockReturnValue(mockClient as any);

    const dashboard = await adminService.loadAdminDashboard();
    expect(dashboard.services).toEqual(demoAdminData.services); // fallback
    expect(mockGetServiceRoleClient).toHaveBeenCalled();
  });

  test("getServices demo", async () => {
    const services = await adminService.getServices();
    expect(services).toEqual(demoAdminData.services);
  });

  test("getStaff demo", async () => {
    const staff = await adminService.getStaff();
    expect(staff).toEqual(demoAdminData.staff);
  });

  test("getProducts demo", async () => {
    const products = await adminService.getProducts();
    expect(products).toEqual(demoAdminData.products);
  });

  test("getNotificationTemplates demo", async () => {
    const templates = await adminService.getNotificationTemplates();
    expect(templates).toEqual(demoAdminData.notifications);
  });

  test("createService throws without client", async () => {
    process.env.USE_DEMO = "false";
    mockGetServiceRoleClient.mockReturnValue(null);

    const service = { name: "Test Service", priceChf: 50, active: true };
    await expect(adminService.createService(service)).rejects.toThrow("Supabase client unavailable");
  });

  // Similar for other CRUD, but mock client success not needed for pure unit, focus validation/RBAC
  test("CRUD functions require client", async () => {
    process.env.USE_DEMO = "false";
    mockGetServiceRoleClient.mockReturnValue(null as any);

    await expect(adminService.updateService("id", { name: "updated" })).rejects.toThrow("Supabase client unavailable");
    await expect(adminService.deleteService("id")).rejects.toThrow("Supabase client unavailable");
    // Repeat pattern for staff, product, notification
  });
});