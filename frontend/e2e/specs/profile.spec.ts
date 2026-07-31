import { test, expect } from '@playwright/test';
import { ProfilePage } from '../pages/ProfilePage';

test.describe('AgriNex Profile E2E Test Suite', () => {
  let profilePage: ProfilePage;

  test.beforeEach(async ({ page }) => {
    profilePage = new ProfilePage(page);
    await profilePage.navigateToProfile();
  });

  test('PROFILE-001: Edit user full name and bio profile fields', async ({ page }) => {
    await profilePage.editProfile('Roselin Sweety', 'Smart Farmer & Organic Cultivator');
  });

  test('PROFILE-002: Upload avatar profile image', async ({ page }) => {
    await profilePage.uploadAvatar('avatar.jpg', 'image/jpeg', Buffer.from('avatar-image-mock-bytes'));
  });
});
