 // @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('E2E Booking Flow', () => {
  const testEmail = 'e2e-booking@example.com';
  const testPassword = 'password123456';
  const testFirstName = 'E2E';
  const testLastName = 'Test User';

  test('full public booking flow -> portal login/view -> cancel appointment', async ({ page }) => {
    // Ensure demo mode if needed, assume playwright env USE_DEMO=true

    // Step 1: Navigate to public booking page and fill form
    await page.goto('/booking');
    await expect(page).toHaveTitle(/Buchung/);

    await page.fill('#firstName', testFirstName);
    await page.fill('#lastName', testLastName);
    await page.fill('#email', testEmail);
    await page.fill('#password', testPassword);
    await page.fill('#phone', '+41 79 123 45 67');

    // Select first service (Signature Cut & Style)
    await page.getByRole('combobox').click();
    await page.getByRole('listitem').filter({ hasText: 'Signature Cut & Style · 60 Min' }).click();

    // Service details appear, select first slot button (10:00)
    await page.locator('button[type="button"]').first().click();

    // Submit booking
    await Promise.all([
      page.waitForResponse(resp => resp.status() === 200 && resp.url().includes('/booking/actions')),
      page.getByRole('button', { name: 'Termin buchen', exact: true }).click()
    ]);

    // Assert success toast
    await expect(page.getByText('Termin bestätigt')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500);

    // Step 2: Navigate to customer portal (demo cookie auto-logs by email)
    await page.goto('/portal');
    await expect(page.getByRole('heading', { name: 'Meine Termine' })).toBeVisible();

    // Assert appointment visible with service name and scheduled status
    await expect(page.getByText('Signature Cut & Style')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-state="default"]', { hasText: 'scheduled' })).toBeVisible(); // Badge

    // Step 3: Cancel appointment
    await Promise.all([
      page.waitForResponse(resp => resp.status() === 200 && resp.url().includes('/booking')),
      page.getByRole('button', { name: 'Stornieren', exact: true }).click()
    ]);

    // Assert status updated to cancelled
    await expect(page.locator('[data-state="default"]', { hasText: 'cancelled' })).toBeVisible({ timeout: 5000 });
  });

  test('booking error states: validation failures', async ({ page }) => {
    await page.goto('/booking');

    // Invalid email, short password, no service
    await page.fill('#firstName', 'Test');
    await page.fill('#lastName', 'User');
    await page.fill('#email', 'invalid-email');
    await page.fill('#password', 'short');
    await page.getByRole('button', { name: 'Termin buchen', exact: true }).click();

    await expect(page.getByText(/Gültige E-Mail/)).toBeVisible();
    await expect(page.getByText(/Passwort mind. 8 Zeichen/)).toBeVisible();
  });
});