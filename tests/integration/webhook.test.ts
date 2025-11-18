import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { POST } from '@/app/api/stripe/webhook/route';
import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { env } from '@/lib/config/env';
import { createClient } from 'supabase/server';
import { hasSupabaseConfig } from '@/lib/config/env';

vi.mock('stripe');

const mockedStripe = vi.mocked(Stripe);

describe('Stripe Webhook Integration', () => {
  let client: any;
  let testOrderId: string;

  beforeAll(async () => {
    if (!hasSupabaseConfig) return;
    client = createClient(env.supabaseUrl!, env.supabaseServiceRoleKey!);
  });

  beforeEach(async () => {
    if (!client) return;
    // Create test order
    const { data } = await client
      .from('orders')
      .insert({
        id: crypto.randomUUID(),
        salon_id: env.defaultSalonId,
        customer_id: '33333333-3333-3333-3333-333333333333',
        status: 'pending',
        total_chf: 48.00
      })
      .select('id')
      .single();
    testOrderId = data.id;
  });

  afterEach(async () => {
    if (!client || !testOrderId) return;
    await client.from('orders').delete().eq('id', testOrderId);
  });

  afterAll(async () => {
    client?.auth?.signOut();
  });

  it('updates order status to paid on payment_intent.succeeded', async () => {
    if (!client) return;

    const event = {
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test123',
          metadata: { orderId: testOrderId }
        }
      }
    } as Stripe.Event;

    mockedStripe.webhooks.constructEvent.mockReturnValue(event);

    const body = JSON.stringify(event);
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
        'content-type': 'application/json'
      },
      body
    });

    const res = await POST(req);

    expect(res.status).toBe(200);

    // Verify DB update
    const { data: updatedOrder } = await client
      .from('orders')
      .select('status, stripe_payment_intent')
      .eq('id', testOrderId)
      .single();

    expect(updatedOrder.status).toBe('paid');
    expect(updatedOrder.stripe_payment_intent).toBe('pi_test123');
  });

  it('returns 400 on invalid signature', async () => {
    mockedStripe.webhooks.constructEvent.mockRejectedValue(new Error('Invalid signature'));

    const body = JSON.stringify({ type: 'test' });
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: { 'stripe-signature': 'invalid' },
      body
    });

    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('ignores non-matching events', async () => {
    if (!client) return;

    const event = { type: 'customer.created' } as Stripe.Event;
    mockedStripe.webhooks.constructEvent.mockReturnValue(event);

    const body = JSON.stringify(event);
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test',
        'content-type': 'application/json'
      },
      body
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Order should not be updated
    const { data: order } = await client
      .from('orders')
      .select('status')
      .eq('id', testOrderId)
      .single();
    expect(order.status).toBe('pending');
  });

  it('ignores payment_intent.payment_failed (order unchanged)', async () => {
    if (!client) return;

    const event = {
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'pi_failed123',
          metadata: { orderId: testOrderId }
        }
      }
    } as Stripe.Event;

    mockedStripe.webhooks.constructEvent.mockReturnValue(event);

    const body = JSON.stringify(event);
    const req = new NextRequest('http://localhost/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
        'content-type': 'application/json'
      },
      body
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    // Order should remain pending
    const { data: order } = await client
      .from('orders')
      .select('status, stripe_payment_intent')
      .eq('id', testOrderId)
      .single();
    expect(order.status).toBe('pending');
    expect(order.stripe_payment_intent).toBeNull();
  });
});