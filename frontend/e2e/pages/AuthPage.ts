import { Page, expect } from '@playwright/test';

export class AuthPage {
  constructor(private page: Page) {}

  async navigateToRegister() {
    await this.page.goto('/register');
  }

  async registerUser(fullName: string, email: string) {
    const nameInput = this.page.locator('input[placeholder*="Jane"], input[name="full_name"], input[type="text"]').first();
    if (await nameInput.isVisible()) {
      await nameInput.fill(fullName);
    }
    const emailInput = this.page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(email);
    }
    const submitBtn = this.page.locator('button[type="submit"]').first();
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
    }
  }

  async enterOTP(code: string) {
    const otpInput = this.page.locator('input[placeholder*="code"], input[placeholder*="OTP"], input[maxLength="6"]').first();
    if (await otpInput.isVisible()) {
      await otpInput.fill(code);
      const verifyBtn = this.page.locator('button[type="submit"], button:has-text("Verify")').first();
      if (await verifyBtn.isVisible()) {
        await verifyBtn.click();
      }
    }
  }

  async setPassword(password: string) {
    const pwdInput = this.page.locator('input[placeholder*="password" i]').first();
    if (await pwdInput.isVisible()) {
      await pwdInput.fill(password);
    }
    const confirmInput = this.page.locator('input[placeholder*="confirm" i]').first();
    if (await confirmInput.isVisible()) {
      await confirmInput.fill(password);
    }
    const completeBtn = this.page.locator('button[type="submit"], button:has-text("Complete")').first();
    if (await completeBtn.isVisible()) {
      await completeBtn.click();
    }
  }

  async navigateToLogin() {
    await this.page.goto('/login');
  }

  async login(email: string, pass: string) {
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', pass);
    await this.page.click('button[type="submit"]');
  }

  async logout() {
    const logoutBtn = this.page.locator('button:has-text("Logout"), button[aria-label*="Logout"]');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
    }
  }

  async forgotPassword(email: string) {
    await this.page.goto('/forgot-password');
    const emailInput = this.page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(email);
      const resetBtn = this.page.locator('button[type="submit"], button:has-text("Send Reset Code")').first();
      if (await resetBtn.isVisible()) {
        await resetBtn.click();
      }
    }
  }
}
