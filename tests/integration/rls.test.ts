import { createClient } from '@supabase/supabase-js'
import { describe, expect, it } from 'vitest'

const hasServiceEnv = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
const hasAnon = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
const describeFn = hasServiceEnv ? describe : describe.skip

// Basic RLS smoke test to ensure service role can access protected resources when configured.
describeFn('RLS policies', () => {
  if (!hasServiceEnv) return

  const supabase = createClient(
    process.env.SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  )

  it('allows service role to list appointments', async () => {
    const { data, error } = await supabase.from('appointments').select('id').limit(1)
    expect(error).toBeNull()
    expect(Array.isArray(data)).toBe(true)
  })

  it('denies anonymous access to customers by default', async () => {
    if (!hasAnon) {
      return expect(hasAnon).toBe(true)
    }
    const anon = createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_ANON_KEY as string)
    const { error } = await anon.from('customers').select('id').limit(1)
    expect(error).toBeTruthy()
  })
})

describe.skip('RLS policies', () => {
  it('skipped because SUPABASE_URL or keys are not set', () => {
    expect(hasServiceEnv).toBe(false)
  })
})
