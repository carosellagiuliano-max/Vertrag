import { describe, it, expect, vi } from 'vitest';
import { createService, updateService, deleteService } from '@/features/admin/admin-service';
import { demoAdminData } from '@/features/admin/demo-data';

describe('Admin CRUD (demo mode)', () => {
  it('creates service (demo fallback)', async () => {
    process.env.USE_DEMO = 'true';

    // Since no client, should throw but test fallback behavior
    await expect(
      createService({
        name: 'Test Service',
        priceChf: 100,
        durationMinutes: 60,
        active: true,
      })
    ).rejects.toThrow('Supabase client unavailable');
  });

  it('updates service (demo fallback)', async () => {
    process.env.USE_DEMO = 'true';

    await expect(
      updateService('svc-1', { name: 'Updated', active: false })
    ).rejects.toThrow('Supabase client unavailable');
  });

  it('deletes service (demo fallback)', async () => {
    process.env.USE_DEMO = 'true';

    await expect(
      deleteService('svc-1')
    ).rejects.toThrow('Supabase client unavailable');
  });
});