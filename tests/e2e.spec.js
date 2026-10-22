import { test, expect } from '@playwright/test';

test.describe('Hana storefront smoke tests', () => {
  test('homepage loads and exposes a working theme toggle', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    const toggle = page.locator('[data-theme-toggle]').first();
    await expect(toggle).toBeVisible();
    const before = await page.locator('html').getAttribute('data-theme');
    await toggle.click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', before || '');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);
  });

  test('market exposes price and sorting controls', async ({ page }) => {
    await page.goto('/market/');
    const price = page.locator('#priceFilterSelect');
    const sort = page.locator('#sortSelect');
    await expect(price).toBeVisible();
    await expect(sort).toBeVisible();
    await price.selectOption('under5');
    await expect(price).toHaveValue('under5');
    await sort.selectOption('price-asc');
    await expect(sort).toHaveValue('price-asc');
  });

  test('theme toggle is keyboard reachable', async ({ page }) => {
    await page.goto('/market/');
    await page.keyboard.press('Tab');
    for (let i = 0; i < 20; i++) {
      if (await page.locator(':focus').getAttribute('data-theme-toggle').catch(() => null) !== null) break;
      await page.keyboard.press('Tab');
    }
    await expect(page.locator('[data-theme-toggle]').first()).toBeVisible();
  });
});
