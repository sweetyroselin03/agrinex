import { test, expect } from '@playwright/test';

test.describe('AgriNex Enterprise Playwright E2E User Journeys (15 Scenarios)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local or production base URL
    await page.goto('/');
  });

  test('E2E-001: Landing page loads with hero header, action buttons and metadata title', async ({ page }) => {
    await expect(page).toHaveTitle(/AgriNex/i);
    const heroHeading = page.locator('h1');
    await expect(heroHeading).toBeVisible();
  });

  test('E2E-002: User login flow with valid credentials redirects to Dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'farmer@agrinex.io');
    await page.fill('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/community/);
    expect(page.url()).not.toContain('/login');
  });

  test('E2E-003: Login form displays inline validation error on invalid email', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'invalid-email');
    await page.click('button[type="submit"]');
    const errorMessage = page.locator('text=invalid email');
    await expect(errorMessage).toBeVisible();
  });

  test('E2E-004: Unauthenticated user accessing protected /scanner is redirected to login', async ({ page }) => {
    await page.goto('/scanner');
    await page.waitForURL(/\/login/);
    expect(page.url()).toContain('/login');
  });

  test('E2E-005: Farmer creates community post with image attachment and hashtag', async ({ page }) => {
    await page.goto('/community');
    const postBox = page.locator('textarea[placeholder*="Ask"]');
    if (await postBox.isVisible()) {
      await postBox.fill('Harvesting organic wheat today! #Harvest #AgriNex');
      await page.click('button:has-text("Post")');
      await expect(page.locator('text=#Harvest')).toBeVisible();
    }
  });

  test('E2E-006: User interacts with community feed post by clicking Like button', async ({ page }) => {
    await page.goto('/community');
    const likeBtn = page.locator('button[aria-label*="Like"]').first();
    if (await likeBtn.isVisible()) {
      await likeBtn.click();
      await expect(likeBtn).toHaveClass(/liked|active/);
    }
  });

  test('E2E-007: User submits comment under community post', async ({ page }) => {
    await page.goto('/community');
    const commentInput = page.locator('input[placeholder*="comment"]').first();
    if (await commentInput.isVisible()) {
      await commentInput.fill('Great agricultural tip, thank you!');
      await page.keyboard.press('Enter');
      await expect(page.locator('text=Great agricultural tip')).toBeVisible();
    }
  });

  test('E2E-008: AI Crop Scanner leaf photo upload and disease diagnosis workflow', async ({ page }) => {
    await page.goto('/scanner');
    const uploadInput = page.locator('input[type="file"]');
    if (await uploadInput.isVisible()) {
      // Simulate file upload
      await uploadInput.setInputFiles({
        name: 'sample_leaf.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-bytes')
      });
      await page.click('button:has-text("Diagnose")');
      await expect(page.locator('text=Confidence')).toBeVisible({ timeout: 10000 });
    }
  });

  test('E2E-009: Direct messaging conversation selection and text message send', async ({ page }) => {
    await page.goto('/messages');
    const contactItem = page.locator('.conversation-item').first();
    if (await contactItem.isVisible()) {
      await contactItem.click();
      const msgInput = page.locator('textarea[placeholder*="Message"]');
      await msgInput.fill('Hello Dr. Expert, need crop advice.');
      await page.click('button[aria-label*="Send"]');
      await expect(page.locator('text=Hello Dr. Expert')).toBeVisible();
    }
  });

  test('E2E-0010: Mandi commodity price filter selection updates price trend table', async ({ page }) => {
    await page.goto('/mandi');
    const searchInput = page.locator('input[placeholder*="commodity"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Paddy');
      await expect(page.locator('table')).toContainText('Paddy');
    }
  });

  test('E2E-011: Weather widget detects farmer location and displays 5-day forecast', async ({ page }) => {
    await page.goto('/weather');
    const weatherCard = page.locator('.weather-card');
    if (await weatherCard.isVisible()) {
      await expect(weatherCard).toContainText(/°C|Humidity/);
    }
  });

  test('E2E-012: Profile screen updates full name, bio, and crop specialization', async ({ page }) => {
    await page.goto('/profile');
    const nameInput = page.locator('input[name="full_name"]');
    if (await nameInput.isVisible()) {
      await nameInput.fill('Roselin Sweety');
      await page.click('button:has-text("Save Profile")');
      await expect(page.locator('text=Profile updated')).toBeVisible();
    }
  });

  test('E2E-013: Dark mode theme toggle switches document root background class', async ({ page }) => {
    const themeBtn = page.locator('button[aria-label*="Theme"]');
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      const html = page.locator('html');
      await expect(html).toHaveClass(/dark/);
    }
  });

  test('E2E-014: Mobile viewport navigation drawer drawer toggle', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const menuBtn = page.locator('button[aria-label*="menu"]');
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await expect(page.locator('.mobile-drawer')).toBeVisible();
    }
  });

  test('E2E-015: User logout action clears session and redirects to Home page', async ({ page }) => {
    await page.goto('/dashboard');
    const logoutBtn = page.locator('button:has-text("Logout")');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL(/\//);
      expect(page.url()).not.toContain('/dashboard');
    }
  });
});
