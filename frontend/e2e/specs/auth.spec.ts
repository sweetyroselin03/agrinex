import { test, expect } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';

test.describe('AgriNex Auth E2E Test Suite', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test('AUTH-001: User registration flow with field validation', async ({ page }) => {
    await authPage.navigateToRegister();
    await expect(page).toHaveTitle(/AgriNex/i);
    await authPage.registerUser('Agri Tester', 'tester@agrinex.io');
  });

  test('AUTH-002: OTP verification step', async ({ page }) => {
    await authPage.navigateToRegister();
    await authPage.enterOTP('123456');
  });

  test('AUTH-003: User login with valid credentials', async ({ page }) => {
    await authPage.navigateToLogin();
    await authPage.login('farmer@agrinex.io', 'Password123!');
  });

  test('AUTH-004: User logout flow clears session', async ({ page }) => {
    await authPage.navigateToLogin();
    await authPage.logout();
  });

  test('AUTH-005: Forgot password email recovery request', async ({ page }) => {
    await authPage.forgotPassword('recovery@agrinex.io');
  });
});
