import { test, expect } from '@playwright/test';
import { CommunityPage } from '../pages/CommunityPage';

test.describe('AgriNex Community E2E Test Suite', () => {
  let communityPage: CommunityPage;

  test.beforeEach(async ({ page }) => {
    communityPage = new CommunityPage(page);
    await communityPage.navigateToCommunity();
  });

  test('COMMUNITY-001: Search registered users with live debounce filtering', async ({ page }) => {
    await communityPage.searchUsers('Sweety');
  });

  test('COMMUNITY-002: Follow and Unfollow farmer user action', async ({ page }) => {
    await communityPage.followUser();
    await communityPage.unfollowUser();
  });

  test('COMMUNITY-003: Create community post with content', async ({ page }) => {
    await communityPage.createPost('Harvesting fresh tomatoes today! #Organic #AgriNex');
  });

  test('COMMUNITY-004: Like and Comment on community feed posts', async ({ page }) => {
    await communityPage.likeFirstPost();
    await communityPage.commentOnFirstPost('Excellent crop yield updates!');
  });
});
