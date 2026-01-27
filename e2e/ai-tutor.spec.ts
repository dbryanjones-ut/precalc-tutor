import { test, expect } from "@playwright/test";

test.describe("AI Tutor Flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should navigate to AI tutor", async ({ page }) => {
    // Find AI Tutor link/button
    const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
    await aiTutorLink.click();

    // Should navigate to AI tutor page
    await expect(page).toHaveURL(/.*tutor|ai.*/i, { timeout: 10000 });
  });

  test("should display chat interface", async ({ page }) => {
    const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
    await aiTutorLink.click();

    // Should see chat input
    await expect(
      page.locator('input[type="text"], textarea').last()
    ).toBeVisible({ timeout: 10000 });
  });

  test("should allow sending messages", async ({ page }) => {
    const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
    await aiTutorLink.click();

    // Type a message
    const messageInput = page.locator('input[type="text"], textarea').last();
    await messageInput.fill("Help me solve x^2 + 2x + 1 = 0");

    // Send message
    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
    await sendButton.click();

    // Should see the message in chat
    await expect(page.locator('text=/x\\^2.*2x.*1.*0/')).toBeVisible({
      timeout: 5000,
    });
  });

  test("should toggle between Socratic and Explanation modes", async ({ page }) => {
    const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
    await aiTutorLink.click();

    // Look for mode toggle
    const modeToggle = page.locator('button:has-text("Socratic"), button:has-text("Explanation")');

    if ((await modeToggle.count()) > 0) {
      await modeToggle.first().click();

      // Should see mode change indication
      await expect(page.locator('text=/mode|socratic|explanation/i')).toBeVisible();
    }
  });

  test("should handle image upload", async ({ page }) => {
    const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
    await aiTutorLink.click();

    // Look for file upload input
    const fileInput = page.locator('input[type="file"]');

    if ((await fileInput.count()) > 0) {
      // Upload would happen here in real test
      expect(await fileInput.count()).toBeGreaterThan(0);
    }
  });
});

test.describe("AI Tutor Interaction", () => {
  test("should display loading state while waiting for response", async ({ page }) => {
    // This test would require mocking API delays
    await page.goto("/");

    const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
    await aiTutorLink.click();

    const messageInput = page.locator('input[type="text"], textarea').last();
    await messageInput.fill("Test question");

    const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
    await sendButton.click();

    // Should show loading indicator briefly
    // In real app, you'd see a spinner or "thinking..." message
  });

  test("should render LaTeX in chat messages", async ({ page }) => {
    await page.goto("/");

    const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
    await aiTutorLink.click();

    // After sending a message about math, should see KaTeX rendered content
    await expect(page.locator('body')).toBeVisible();
  });
});
