import { describe, expect, test, vi, beforeEach } from "vitest";
import { addMinutes, parseISO, formatISO } from "date-fns";
import * as bookingService from "../../features/booking/booking-service";
import * as demoStore from "../../features/booking/demo-store";
import { getServiceRoleClient } from "../../lib/supabase/admin";
import { cookies } from "next/headers";
import { validateBookingRules } from "../../lib/domain/booking-rules";

vi.mock("../../features/booking/demo-store");
vi.mock("../../lib/supabase/admin");
vi.mock("next/headers");

const mockPersistDemoBooking = demoStore.persistDemoBooking as vi.Mock;
const mockListDemoBookings = demoStore.listDemoBookings as vi.Mock;
const mockCancelDemoBooking = demoStore.cancelDemoBooking as vi.Mock;
const mockGetDemoSalonContext = demoStore.getDemoSalonContext as vi.Mock;

const mockGetServiceRoleClient = getServiceRoleClient as vi.Mock;
const mockCookies = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  process.env.USE_DEMO = "true";
  (cookies as vi.Mock).mockReturnValue({
    set: vi.fn(),
  } as any);
});

describe("booking-service", () => {
  test("createBooking demo mode valid slot", async () => {
    const input = {
      email: "test@example.com",
      password: "pass",
      firstName: "Test",
      lastName: "User",
      serviceId: "svc1",
      serviceName: "Cut",
      startAt: "2025-01-01T10:00:00Z",
      durationMinutes: 60,
    };

    const mockBooking = {
      id: "apt1",
      status: "scheduled" as const,
      startAt: "2025-01-01T10:00:00Z",
      endAt: "2025-01-01T11:00:00Z",
    };
    mockPersistDemoBooking.mockReturnValue(mockBooking);

    const result = await bookingService.createBooking(input);

    expect(mockPersistDemoBooking).toHaveBeenCalledWith(expect.objectContaining({
      email: input.email,
      startAt: input.startAt,
      endAt: "2025-01-01T11:00:00.000Z",
    }));
    expect(result.appointmentId).toBe("apt1");
    expect(result.status).toBe("scheduled");
    expect((cookies as vi.Mock)().set).toHaveBeenCalledWith("demo-user-email", input.email, expect.any(Object));
  });

  test("createBooking demo mode invalid slot throws", async () => {
    const input = {
      email: "test@example.com",
      password: "pass",
      firstName: "Test",
      lastName: "User",
      serviceId: "svc1",
      serviceName: "Cut",
      startAt: new Date(Date.now() - 1000).toISOString(), // past
      durationMinutes: 60,
    };

    await expect(bookingService.createBooking(input)).rejects.toThrow("Slot darf nicht in der Vergangenheit liegen");
  });

  test("createBooking real mode skips demo, uses Supabase", async () => {
    process.env.USE_DEMO = "false";
    const input = {
      email: "new@example.com",
      password: "pass",
      firstName: "New",
      lastName: "User",
      serviceId: "svc1",
      serviceName: "Cut",
      startAt: "2025-01-01T10:00:00Z",
      durationMinutes: 60,
    };

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        auth: {
          admin: {
            listUsers: vi.fn().mockResolvedValue({ data: { users: [] } }),
            createUser: vi.fn().mockResolvedValue({ data: { user: { id: "user1" } } }),
          },
          signInWithPassword: vi.fn(),
        },
        upsert: vi.fn().mockResolvedValue({}),
        insert: vi.fn().mockResolvedValue({ data: { id: "cust1" } }),
      }),
    };
    mockGetServiceRoleClient.mockReturnValue(mockClient as any);

    // Mock validation ok
    const originalValidate = validateBookingRules;
    vi.spyOn({ validateBookingRules }, "validateBookingRules").mockReturnValue({ ok: true, reasons: [] });

    const result = await bookingService.createBooking(input);

    expect(result.status).toBe("scheduled");
    expect(mockGetServiceRoleClient).toHaveBeenCalled();
  });

  test("createBooking real mode rejects overlap", async () => {
    process.env.USE_DEMO = "false";
    const input = {
      email: "overlap@example.com",
      password: "pass",
      firstName: "Overlap",
      lastName: "User",
      serviceId: "svc1",
      serviceName: "Cut",
      startAt: "2025-01-01T10:00:00Z",
      durationMinutes: 60,
    };

    const mockClient = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === "appointments") {
          return {
            select: vi.fn().mockResolvedValue({
              data: [
                {
                  start_at: "2025-01-01T10:30:00Z",
                  end_at: "2025-01-01T11:30:00Z",
                },
              ],
            }),
            eq: vi.fn().mockReturnThis(),
          };
        }
        // Mock other tables as needed
        return {
          select: vi.fn().mockResolvedValue({ data: null }),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          auth: {
            admin: {
              listUsers: vi.fn().mockResolvedValue({ data: { users: [] } }),
              createUser: vi.fn().mockResolvedValue({ data: { user: { id: "user1" } } }),
            },
            signInWithPassword: vi.fn(),
          },
          upsert: vi.fn().mockResolvedValue({}),
          insert: vi.fn().mockResolvedValue({ data: { id: "cust1" } }),
        };
      }),
    };
    mockGetServiceRoleClient.mockReturnValue(mockClient as any);

    // The overlapping appointment will cause validateBookingRules to fail
    await expect(bookingService.createBooking(input)).rejects.toThrow(/überschneidet|overlap/);
  });

  test("loadUpcomingAppointments demo mode", async () => {
    mockListDemoBookings.mockReturnValue([
      { id: "1", startAt: "2025-01-01T10:00:00Z", endAt: "2025-01-01T11:00:00Z", status: "scheduled", note: "test", serviceName: "Cut" },
    ]);

    const result = await bookingService.loadUpcomingAppointments("test@example.com");

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
    expect(mockListDemoBookings).toHaveBeenCalledWith("test@example.com");
  });

  test("loadUpcomingAppointments no email falls back to demo", async () => {
    const result = await bookingService.loadUpcomingAppointments();

    expect(mockListDemoBookings).toHaveBeenCalledWith(undefined);
  });

  test("cancelBooking demo mode", async () => {
    mockCancelDemoBooking.mockResolvedValue({ id: "apt1", status: "cancelled" });

    const result = await bookingService.cancelBooking("apt1", "Customer request");

    expect(result).toEqual({ id: "apt1", status: "cancelled" });
    expect(mockCancelDemoBooking).toHaveBeenCalledWith("apt1", "Customer request");
  });

  test("getDefaultBookingContext demo", () => {
    const result = bookingService.getDefaultBookingContext();

    expect(result).toEqual({ salonId: expect.any(String), staffId: expect.any(String) });
  });
});