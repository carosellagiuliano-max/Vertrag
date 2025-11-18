import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { env } from '@/lib/config/env';
import { createClient } from 'supabase/server';
import { hasSupabaseConfig } from '@/lib/config/env';

describe('Audit Triggers', () => {
  let client: any;

  beforeAll(async () => {
    if (!hasSupabaseConfig) return;
    client = createClient(env.supabaseUrl!, env.supabaseServiceRoleKey!);
  });

  afterAll(async () => {
    client?.auth?.signOut();
  });

  const clearRecentAuditLogs = async () => {
    if (!client) return;
    // Clear audit logs from last hour for clean slate
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    await client.from('audit_logs').delete().gte('created_at', oneHourAgo);
  };

  beforeEach(async () => {
    await clearRecentAuditLogs();
  });

  const countAuditLogs = async (tableName: string) => {
    const { count } = await client
      .from('audit_logs')
      .select('*', { count: 'exact', head: true })
      .eq('table_name', tableName)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString());
    return count ?? 0;
  };

  it('triggers audit on appointment INSERT', async () => {
    if (!client) return;

    const testAppointment = {
      salon_id: env.defaultSalonId,
      customer_id: 'test-customer-123',
      staff_id: env.defaultStaffId,
      service_id: 'test-service',
      start_at: '2025-01-01T10:00:00Z',
      end_at: '2025-01-01T11:00:00Z',
      status: 'scheduled',
    };

    const { data, error } = await client
      .from('appointments')
      .insert(testAppointment)
      .select()
      .single();

    expect(error).toBe(null);
    expect(data).toBeDefined();

    const count = await countAuditLogs('appointments');
    expect(count).toBe(1);

    const { data: logs } = await client
      .from('audit_logs')
      .select('action, old_row, new_row')
      .eq('table_name', 'appointments')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    expect(logs.action).toBe('INSERT');
    expect(logs.old_row).toBeNull();
    expect(JSON.parse(logs.new_row as string)).toMatchObject(testAppointment);
  });

  it('triggers audit on appointment UPDATE', async () => {
    if (!client) return;

    const testAppointment = {
      salon_id: env.defaultSalonId,
      customer_id: 'test-customer-update',
      staff_id: env.defaultStaffId,
      service_id: 'test-service',
      start_at: '2025-01-01T10:00:00Z',
      end_at: '2025-01-01T11:00:00Z',
      status: 'scheduled',
    };

    const { data: inserted } = await client
      .from('appointments')
      .insert(testAppointment)
      .select('id')
      .single();

    await client
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', inserted.id);

    const count = await countAuditLogs('appointments');
    expect(count).toBe(2);

    const { data: logs } = await client
      .from('audit_logs')
      .select('action, old_row, new_row')
      .eq('table_name', 'appointments')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    expect(logs.action).toBe('UPDATE');
    const oldRow = JSON.parse(logs.old_row as string);
    const newRow = JSON.parse(logs.new_row as string);
    expect(oldRow.status).toBe('scheduled');
    expect(newRow.status).toBe('cancelled');
  });

  it('triggers audit on order INSERT/UPDATE', async () => {
    if (!client) return;

    const testOrder = {
      salon_id: env.defaultSalonId,
      customer_id: 'test-customer-order',
      status: 'pending',
      total_chf: 100.0,
    };

    const { data: inserted } = await client
      .from('orders')
      .insert(testOrder)
      .select('id')
      .single();

    await client
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', inserted.id);

    const insertCount = await countAuditLogs('orders');
    expect(insertCount).toBe(2); // insert + update

    const { data: logs } = await client
      .from('audit_logs')
      .select('action')
      .eq('table_name', 'orders')
      .order('created_at', { ascending: false })
      .limit(2);

    expect(logs[0].action).toBe('UPDATE');
    expect(logs[1].action).toBe('INSERT');
  });

  it('triggers audit on consent withdrawal (customers UPDATE)', async () => {
    if (!client) return;

    const testCustomer = {
      salon_id: env.defaultSalonId,
      profile_id: 'test-profile-consent',
      marketing_opt_in: true,
    };

    const { data: inserted } = await client
      .from('customers')
      .insert(testCustomer)
      .select('id')
      .single();

    await client
      .from('customers')
      .update({ marketing_opt_in: false })
      .eq('id', inserted.id);

    const count = await countAuditLogs('customers');
    expect(count).toBe(2);

    const { data: logs } = await client
      .from('audit_logs')
      .select('action, old_row, new_row')
      .eq('table_name', 'customers')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    expect(logs.action).toBe('UPDATE');
    const oldRow = JSON.parse(logs.old_row as string);
    const newRow = JSON.parse(logs.new_row as string);
    expect(oldRow.marketing_opt_in).toBe(true);
    expect(newRow.marketing_opt_in).toBe(false);
  });
});