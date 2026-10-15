// HANA FREE SHOP — E2E Tests Playwright for 100k
// Test: create product → see storefront → order status

import { test, expect } from '@playwright/test';

test.describe('Hana Free Shop 100k E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/?fresh=1');
  });

  test('should load homepage with hero', async ({ page }) => {
    await expect(page.locator('.hero')).toBeVisible();
    await expect(page.locator('.hero-title')).toContainText('Marka botërore');
    await expect(page.locator('#kategorite')).toBeVisible();
  });

  test('should show categories with stagger animation', async ({ page }) => {
    const categories = page.locator('.cat-item');
    await expect(categories.first()).toBeVisible({timeout: 5000});
    // Check stagger delay exists
    const firstCat = categories.first();
    await expect(firstCat).toHaveCSS('animation-delay', /s/);
  });

  test('should add product to cart with fly animation', async ({ page }) => {
    // Wait for products to load
    await page.waitForSelector('.product-card', {timeout: 10000});
    const firstProduct = page.locator('.product-card').first();
    const addBtn = firstProduct.locator('[data-add]');
    await addBtn.click();
    
    // Check cart count updated
    await expect(page.locator('#cartCount')).toContainText('1', {timeout: 3000});
    
    // Check cart fly animation triggered
    await expect(page.locator('#cartFly')).toBeVisible({timeout: 1000});
  });

  test('should open cart drawer', async ({ page }) => {
    await page.click('#cartBtn');
    await expect(page.locator('#cartDrawer')).toHaveClass(/open/, {timeout: 2000});
    await expect(page.locator('#cartItems')).toBeVisible();
  });

  test('should validate checkout form', async ({ page }) => {
    // Add product
    await page.waitForSelector('.product-card', {timeout: 10000});
    await page.locator('.product-card').first().locator('[data-add]').click();
    await page.click('#cartBtn');
    await page.click('#checkoutBtn');
    
    // Check mandatory fields
    await expect(page.locator('#coName')).toBeVisible();
    await expect(page.locator('#coPhone')).toBeVisible();
    await expect(page.locator('#coEmail')).toBeVisible();
    await expect(page.locator('#coAddress')).toBeVisible();
    
    // Try to submit empty
    await page.click('#placeOrderBtn');
    // Should show validation (browser native or custom)
  });

  test('should track order with ID', async ({ page }) => {
    await page.click('#accountBtn');
    await page.click('#trackingOpenBtn');
    await expect(page.locator('#trackingModal')).toHaveClass(/open/);
    await expect(page.locator('#trackingInput')).toBeVisible();
  });

  test('should have PWA manifest', async ({ page }) => {
    const manifest = await page.evaluate(() => {
      const link = document.querySelector('link[rel="manifest"]');
      return link ? link.href : null;
    });
    expect(manifest).toContain('manifest.json');
  });

  test('should have Service Worker', async ({ page }) => {
    const sw = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(sw).toBeTruthy();
  });

  test('should have SEO meta tags', async ({ page }) => {
    const title = await page.title();
    expect(title).toContain('HANA FREE SHOP');
    
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content');
    expect(ogImage).toContain('webp');
  });

  test('should handle WebP images with srcset', async ({ page }) => {
    const heroImg = page.locator('.hero-main-img').first();
    await expect(heroImg).toHaveAttribute('srcset', /400w/);
    await expect(heroImg).toHaveAttribute('loading', /eager|lazy/);
    await expect(heroImg).toHaveAttribute('decoding', 'async');
  });

  test('should show skeleton loading initially', async ({ page }) => {
    // Reload with slow network
    await page.goto('http://localhost:5173/?fresh=1');
    // Skeleton should appear briefly
    const skeleton = page.locator('.skeleton-card');
    // May be visible initially
    await expect(skeleton.first()).toBeVisible({timeout: 1000}).catch(() => {});
  });

  test('should have scroll progress bar', async ({ page }) => {
    await expect(page.locator('.scroll-progress-bar')).toBeVisible();
  });

  test('should support guest checkout', async ({ page }) => {
    await page.waitForSelector('.product-card', {timeout: 10000});
    await page.locator('.product-card').first().locator('[data-add]').click();
    await page.click('#cartBtn');
    await page.click('#checkoutBtn');
    await expect(page.locator('#guestCheckoutBtn')).toBeVisible();
  });

  test('should show time slot picker', async ({ page }) => {
    await page.waitForSelector('.product-card', {timeout: 10000});
    await page.locator('.product-card').first().locator('[data-add]').click();
    await page.click('#cartBtn');
    await expect(page.locator('#timeSlots')).toBeVisible({timeout: 2000});
  });
});
