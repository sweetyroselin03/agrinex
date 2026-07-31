import { Page, expect } from '@playwright/test';

export class AuthPage {
  constructor(private page: Page) {}

  async navigateToRegister() {
    await this.page.goto('/signup');
  }

  async registerUser(fullName: string, email: string) {
    await this.page.fill('input[name="full_name"]', fullName);
    await this.page.fill('input[type="email"]', email);
    await this.page.click('button[type="submit"]');
  }

  async enterOTP(code: string) {
    const inputs = this.page.locator('input[maxLength="1"]');
    const count = await inputs.count();
    if (count === 6) {
      for (let i = 0; i < 6; i++) {
        await inputs.nth(i).fill(code[i] || '1');
      }
    } else {
      await this.page.fill('input[placeholder*="OTP"]', code);
    }
    await this.page.click('button:has-text("Verify")');
  }

  async setPassword(password: string) {
    await this.page.fill('input[placeholder*="Create Password"]', password);
    await this.page.fill('input[placeholder*="Confirm Password"]', password);
    await this.page.click('button:has-text("Complete Registration")');
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
    await this.page.goto('/login');
    const forgotLink = this.page.locator('text=Forgot Password');
    if (await forgotLink.isVisible()) {
      await forgotLink.click();
      await this.page.fill('input[type="email"]', email);
      await this.page.click('button:has-text("Send Reset Link")');
    }
  }
}
