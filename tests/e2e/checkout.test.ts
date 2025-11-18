 // @ts-nocheck
import { test, expect } from '@playwright/test';

test.describe('E2E Checkout Flow', () => {
  const testEmail = 'e2e-checkout@example.com';

  test('shop add-to-cart -> checkout -> payment success -> portal order tracking', async ({ page }) => {
    // Step 1: Navigate to shop, add product to cart
    await page.goto('/shop');
    await expect(page).toHaveTitle(/Shop/);

    // Add first available product to cart (assume first AddToCartButton)
    await Promise.all([
      page.waitForResponse(resp => resp.status() === 200 && resp.url().includes('/shop/actions')),
      page.locator('[data-testid="add-to-cart"]').first().click() // Assume button has testid or use role
    ]);
    await expect(page.getByText('Zum Warenkorb hinzugefügt')).toBeVisible({ timeout: 5000 });

    // Step 2: Go to checkout, fill form, submit (demo mode no Stripe redirect)
    await page.goto('/checkout');
    await page.fill('[name="email"]', testEmail);
    await page.fill('[name="name"]', 'E2E Checkout User');

    await Promise.all([
      page.waitForResponse(resp => resp.status() === 200 && resp.url().includes('/checkout/actions')),
      page.getByRole('button', { name: /Bestellen|Place Order/, exact: true }).click()
    ]);

    // Assert success
    await expect(page.getByText('Bestellung erfolgreich')).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1500);

    // Step 3: Navigate to portal, assert order visible
    await page.goto('/portal');
    await expect(page.getByRole('heading', { name: 'Meine Termine' })).toBeVisible();

    // Scroll to orders section, assert order listed
    await page.getByRole('heading', { name: /Bestellungen/ }).scrollIntoViewIfNeeded();
    await expect(page.locator('text=/order|Bestellung/')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=paid')).toBeVisible(); // Assume status badge
  });

  test('checkout error states: empty cart, invalid email', async ({ page }) => {
    await page.goto('/checkout');

    // Empty cart
    await page.getByRole('button', { name: /Bestellen|Place Order/, exact: true }).click();
    await expect(page.getByText(/Warenkorb leer/)).toBeVisible();

    // Invalid email
    await page.fill('[name="email"]', 'invalid');
    await page.getByRole('button', { name: /Bestellen|Place Order/, exact: true }).click();
    await expect(page.getByText(/E-Mail/)).toBeVisible();
  });
});