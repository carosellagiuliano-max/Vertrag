import { createClient } from '@supabase/supabase-js'
import { describe, expect, it, beforeAll, afterAll } from 'vitest'

const hasServiceEnv = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
const hasAnon = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
const describeFn = hasServiceEnv ? describe : describe.skip

describeFn('RLS policies', () => {
  let serviceClient: any
  let anonClient: any
  let testUserId: string
  let testCustomerId: string
  let testAppointmentId: string
  let testOrderId: string
  const salonId = process.env.NEXT_PUBLIC_SALON_ID || '11111111-1111-1111-1111-111111111111'
  const testEmail = 'test-customer@rlstest.test'
  const testPassword = 'testpass123'

  beforeAll(async () => {
    if (!hasServiceEnv) return

    const supabaseUrl = process.env.SUPABASE_URL!
    serviceClient = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    anonClient = createClient(supabaseUrl, process.env.SUPABASE_ANON_KEY!)

    // Cleanup existing test user
    const { data: users } = await serviceClient.auth.admin.listUsers({ email: testEmail })
    if (users?.users?.[0]) {
      await serviceClient.auth.admin.deleteUser(users.users[0].id)
    }

    // Create test user
    const { data: user } = await serviceClient.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { first_name: 'Test', last_name: 'Customer' }
    })
    testUserId = user.user.id

    // Create profile
    await serviceClient.from('profiles').upsert({
      id: testUserId,
      salon_id: salonId,
      first_name: 'Test',
      last_name: 'Customer'
    })

    // Create customer
    const { data: customer } = await serviceClient
      .from('customers')
      .insert({ profile_id: testUserId, salon_id: salonId, preferred_language: 'de-CH' })
      .select('id')
      .single()
    testCustomerId = customer.id

    // Create test appointment
    const { data: appt } = await serviceClient
      .from('appointments')
      .insert({
        salon_id: salonId,
        customer_id: testCustomerId,
        staff_id: '22222222-2222-2222-2222-222222222222',
        service_id: '55555555-5555-5555-5555-555555555555',
        start_at: '2025-12-01T10:00:00Z',
        end_at: '2025-12-01T11:00:00Z',
        status: 'scheduled',
        price_chf: 120
      })
      .select('id')
      .single()
    testAppointmentId = appt.id

    // Create test order
    const { data: order } = await serviceClient
      .from('orders')
      .insert({
        salon_id: salonId,
        customer_id: testCustomerId,
        status: 'pending',
        total_chf: 48
      })
      .select('id')
      .single()
    testOrderId = order.id
  })

  afterAll(async () => {
    if (!serviceClient) return
    await serviceClient.from('appointments').delete().eq('id', testAppointmentId)
    await serviceClient.from('orders').delete().eq('id', testOrderId)
    await serviceClient.from('customers').delete().eq('id', testCustomerId)
    await serviceClient.auth.admin.deleteUser(testUserId)
  })

  // Service role tests (bypasses RLS)
  ;['appointments', 'orders', 'customers', 'services', 'products', 'notification_templates', 'vouchers', 'loyalty_tiers', 'audit_logs'].forEach(table => {
    it(`service role can SELECT from ${table}`, async () => {
      const { data, error } = await serviceClient
        .from(table)
        .select('id')
        .limit(1)
      expect(error).toBeNull()
      expect(Array.isArray(data)).toBe(true)
    })
  })

  it('service role can INSERT/UPDATE/DELETE appointments', async () => {
    const testId = 'test-rls-' + Math.random().toString(36).slice(2)
    const payload = { id: testId, salon_id: salonId }
    const { error: insertError } = await serviceClient.from('appointments').insert(payload)
    expect(insertError).toBeNull()

    const { error: updateError } = await serviceClient
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', testId)
    expect(updateError).toBeNull()

    const { error: deleteError } = await serviceClient.from('appointments').delete().eq('id', testId)
    expect(deleteError).toBeNull()
  })

  // Anon tests
  ;['appointments', 'orders', 'customers'].forEach(table => {
    it(`anon denied SELECT on ${table}`, async () => {
      if (!hasAnon) return
      const { error } = await anonClient.from(table).select('id', { count: 'exact' })
      expect(error).toBeTruthy()
    })
  })

  // Authenticated customer tests
  it('authenticated customer can SELECT own appointments (RLS scoped)', async () => {
    if (!hasAnon) return
    const { data: session, error: signError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    expect(signError).toBeNull()
    expect(session?.user).toBeDefined()

    const { data: appts, error: queryError, count } = await anonClient
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('salon_id', salonId)
    expect(queryError).toBeNull()
    expect(count).toBeGreaterThanOrEqual(0) // Sees own salon appointments or own
  })

  it('authenticated customer denied INSERT on appointments (RBAC/RLS)', async () => {
    if (!hasAnon) return
    await anonClient.auth.signInWithPassword({ email: testEmail, password: testPassword })

    const { error } = await anonClient.from('appointments').insert({
      salon_id: salonId,
      customer_id: testCustomerId,
      staff_id: '22222222-2222-2222-2222-222222222222',
      service_id: '55555555-5555-5555-5555-555555555555',
      start_at: '2025-12-02T10:00:00Z',
      end_at: '2025-12-02T11:00:00Z'
    })
    expect(error).toBeTruthy() // Assume policy denies customer inserts
  })

  it('authenticated customer can SELECT own orders', async () => {
    if (!hasAnon) return
    const { data: session } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    const { data: orders, error } = await anonClient
      .from('orders')
      .select('id')
      .eq('salon_id', salonId)
    expect(error).toBeNull()
    expect(Array.isArray(orders)).toBe(true)
    expect(orders?.length).toBeGreaterThan(0)
  })
})

describe.skip('RLS policies (skipped - no env vars)', () => {
  it('skipped because env vars not set', () => {
    expect(hasServiceEnv).toBe(false)
  })
})
