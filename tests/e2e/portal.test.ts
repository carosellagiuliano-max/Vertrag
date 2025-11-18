import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadUpcomingAppointments } from '@/features/booking/booking-service';
import { loadOrders } from '@/features/shop/shop-service';
import * as demoBooking from '@/features/booking/demo-store';
import * as demoShop from '@/features/shop/demo-store';

vi.mock('@/features/booking/demo-store');
vi.mock('@/features/shop/demo-store');

describe('Portal Flows (demo mode)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads upcoming appointments', async () => {
    process.env.USE_DEMO = 'true';
    (demoBooking.listDemoBookings as vi.Mock).mockReturnValue([
      { id: 'appt-1', status: 'scheduled', startAt: '2025-01-01T10:00:00Z' }
    ]);

    const appointments = await loadUpcomingAppointments('test@example.com');

    expect(appointments).toHaveLength(1);
    expect(demoBooking.listDemoBookings).toHaveBeenCalledWith('test@example.com');
  });

  it('loads orders', async () => {
    process.env.USE_DEMO = 'true';
    (demoShop.listDemoOrders as vi.Mock).mockReturnValue([
      { id: 'order-1', status: 'paid', totalChf: 100 }
    ]);

    const orders = await loadOrders('test@example.com');

    expect(orders).toHaveLength(1);
    expect(demoShop.listDemoOrders).toHaveBeenCalledWith('test@example.com');
  });
});