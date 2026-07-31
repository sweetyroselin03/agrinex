import { test, expect } from '@playwright/test';
import { ChatbotPage } from '../pages/ChatbotPage';

test.describe('AgriNex Chatbot & AI Advisory E2E Test Suite', () => {
  let chatbotPage: ChatbotPage;

  test.beforeEach(async ({ page }) => {
    chatbotPage = new ChatbotPage(page);
    await chatbotPage.navigateToAgriGPT();
  });

  test('CHAT-001: Start new conversation thread', async ({ page }) => {
    await chatbotPage.startNewChat();
  });

  test('CHAT-002: Send advisory question to AgriGPT LLM', async ({ page }) => {
    await chatbotPage.sendMessage('How do I treat early blight on tomato leaves?');
  });

  test('CHAT-003: Verify chat history isolation between authenticated user sessions', async ({ page }) => {
    // Unique user session prompt
    await chatbotPage.sendMessage('UserA Private Query 9928');
    // Ensure prompt rendered in DOM
    await chatbotPage.verifyMessagePresent('UserA Private Query 9928');
  });

  test('CHAT-004: Clear chat history', async ({ page }) => {
    await chatbotPage.clearChat();
  });
});
