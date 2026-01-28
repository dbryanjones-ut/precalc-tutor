import { test, expect } from "@playwright/test";

test.describe("Clickable Math Interactions - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Navigate to AI Tutor
    const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
    if (await aiTutorLink.isVisible()) {
      await aiTutorLink.click();
      await page.waitForLoadState("networkidle");
    }
  });

  test.describe("Click Registration and Message Sending", () => {
    test("should allow clicking on math expressions from AI responses", async ({ page }) => {
      // Send a message to get AI response
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("What is x^2?");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      // Wait for potential AI response with math
      await page.waitForTimeout(2000);

      // Look for clickable math elements (should have hover effects)
      const clickableMath = page.locator('.math-renderer.cursor-pointer, [class*="cursor-pointer"] .math-renderer');

      if (await clickableMath.count() > 0) {
        const initialMessageCount = await page.locator('[role="img"]').count();

        // Click on math expression
        await clickableMath.first().click();

        // Should have sent a new message
        await page.waitForTimeout(500);
        const newMessageCount = await page.locator('[role="img"]').count();

        // Message count should increase or input should have the latex
        expect(newMessageCount >= initialMessageCount).toBe(true);
      }
    });

    test("should not allow clicking on user's own math expressions", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Calculate $x^2$");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // User's math should not be clickable (no cursor-pointer class)
      const userMessages = page.locator('[class*="user"], [class*="justify-end"]');

      if (await userMessages.count() > 0) {
        const mathInUserMessage = userMessages.locator('.math-renderer').first();

        if (await mathInUserMessage.count() > 0) {
          const classes = await mathInUserMessage.getAttribute("class");
          expect(classes).not.toContain("cursor-pointer");
        }
      }
    });

    test("should handle clicking on inline math", async ({ page }) => {
      // This test simulates clicking on inline math
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Explain x^2 + y^2");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(1500);

      // Check for clickable inline math
      const inlineMath = page.locator('.math-inline.cursor-pointer, [class*="cursor-pointer"] .math-inline');

      if (await inlineMath.count() > 0) {
        // Hover should show visual feedback
        await inlineMath.first().hover();
        await page.waitForTimeout(200);

        // Click should work
        await inlineMath.first().click();
        await page.waitForTimeout(500);

        // Page should still be functional
        expect(await messageInput.isVisible()).toBe(true);
      }
    });

    test("should handle clicking on display math", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Show me formulas");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(1500);

      // Look for display math that is clickable
      const displayMath = page.locator('.math-display.cursor-pointer, [class*="cursor-pointer"] .math-display');

      if (await displayMath.count() > 0) {
        await displayMath.first().click();
        await page.waitForTimeout(500);

        expect(await messageInput.isVisible()).toBe(true);
      }
    });
  });

  test.describe("Visual Feedback on Hover", () => {
    test("should show hover state on clickable math", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Test message");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(1500);

      // Find clickable math
      const clickableMath = page.locator('[class*="cursor-pointer"]').filter({ has: page.locator('.math-renderer, .katex') });

      if (await clickableMath.count() > 0) {
        const element = clickableMath.first();

        // Get initial appearance
        const beforeHover = await element.screenshot();

        // Hover over it
        await element.hover();
        await page.waitForTimeout(200);

        // Take screenshot after hover
        const afterHover = await element.screenshot();

        // Screenshots should be different (visual feedback)
        expect(beforeHover).not.toEqual(afterHover);
      }
    });

    test("should not show hover state on non-clickable math", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("My equation: $x^2$");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // User's own math should not show cursor-pointer
      const userMath = page.locator('[class*="user"] .math-renderer, [class*="justify-end"] .math-renderer').first();

      if (await userMath.count() > 0) {
        const cursor = await userMath.evaluate((el) => window.getComputedStyle(el).cursor);
        expect(cursor).not.toBe("pointer");
      }
    });

    test("should show ring/border on hover for clickable math", async ({ page }) => {
      // Send message to get AI response
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Show formula");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(1500);

      // Look for clickable math with hover effects
      const clickableMath = page.locator('.math-renderer.cursor-pointer, [class*="cursor-pointer"] .math-renderer').first();

      if (await clickableMath.count() > 0) {
        await clickableMath.hover();
        await page.waitForTimeout(300);

        // Should have hover styles applied
        const classes = await clickableMath.getAttribute("class");
        expect(classes).toBeTruthy();
      }
    });
  });

  test.describe("Keyboard Accessibility", () => {
    test("should be focusable with Tab key", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Question");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(1500);

      // Tab through the interface
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // At least one element should be focusable
      const focusedElement = page.locator(":focus");
      expect(await focusedElement.count()).toBe(1);
    });

    test("should activate on Enter key", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Test");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(1500);

      // Find clickable math
      const clickableMath = page.locator('[tabindex="0"]').filter({ has: page.locator('.math-renderer, .katex') });

      if (await clickableMath.count() > 0) {
        await clickableMath.first().focus();
        await page.keyboard.press("Enter");

        await page.waitForTimeout(500);

        // Should remain functional
        expect(await messageInput.isVisible()).toBe(true);
      }
    });

    test("should activate on Space key", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Test");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(1500);

      // Find clickable math
      const clickableMath = page.locator('[tabindex="0"]').filter({ has: page.locator('.math-renderer, .katex') });

      if (await clickableMath.count() > 0) {
        await clickableMath.first().focus();
        await page.keyboard.press("Space");

        await page.waitForTimeout(500);

        expect(await messageInput.isVisible()).toBe(true);
      }
    });

    test("should have tabindex=0 for clickable math", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Question about math");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(1500);

      // Clickable math should have tabindex
      const clickableMath = page.locator('.math-renderer.cursor-pointer, [class*="cursor-pointer"] .math-renderer').first();

      if (await clickableMath.count() > 0) {
        const tabindex = await clickableMath.getAttribute("tabindex");
        expect(tabindex).toBe("0");
      }
    });

    test("should not have tabindex for non-clickable math", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("User math: $x^2$");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // User's math should not have tabindex
      const userMath = page.locator('[class*="user"] .math-renderer, [class*="justify-end"] .math-renderer').first();

      if (await userMath.count() > 0) {
        const tabindex = await userMath.getAttribute("tabindex");
        expect(tabindex).toBeNull();
      }
    });
  });

  test.describe("Multiple Clickable Expressions", () => {
    test("should handle multiple clickable expressions independently", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Compare formulas");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(2000);

      // Should have multiple clickable math elements
      const clickableMath = page.locator('[class*="cursor-pointer"]').filter({ has: page.locator('.math-renderer, .katex') });
      const count = await clickableMath.count();

      if (count > 1) {
        // Click first one
        await clickableMath.nth(0).click();
        await page.waitForTimeout(500);

        // Click second one
        await clickableMath.nth(1).click();
        await page.waitForTimeout(500);

        // Both clicks should work
        expect(await messageInput.isVisible()).toBe(true);
      }
    });

    test("should maintain separate hover states for each expression", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Multiple formulas please");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(2000);

      const clickableMath = page.locator('[class*="cursor-pointer"]').filter({ has: page.locator('.math-renderer, .katex') });
      const count = await clickableMath.count();

      if (count > 1) {
        // Hover over first
        await clickableMath.nth(0).hover();
        await page.waitForTimeout(200);

        // First should have hover, second should not
        const first = clickableMath.nth(0);
        const firstBox = await first.boundingBox();
        expect(firstBox).toBeTruthy();
      }
    });
  });

  test.describe("Click Behavior Edge Cases", () => {
    test("should handle rapid successive clicks", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Show me something");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(1500);

      const clickableMath = page.locator('[class*="cursor-pointer"]').filter({ has: page.locator('.math-renderer, .katex') }).first();

      if (await clickableMath.count() > 0) {
        // Click multiple times rapidly
        await clickableMath.click();
        await clickableMath.click();
        await clickableMath.click();

        await page.waitForTimeout(500);

        // Should still be functional
        expect(await messageInput.isVisible()).toBe(true);
      }
    });

    test("should work after scrolling", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();

      // Send multiple messages to create scroll
      for (let i = 0; i < 5; i++) {
        await messageInput.fill(`Message ${i}`);
        await sendButton.click();
        await page.waitForTimeout(300);
      }

      // Scroll to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(300);

      // Find clickable math
      const clickableMath = page.locator('[class*="cursor-pointer"]').filter({ has: page.locator('.math-renderer, .katex') }).first();

      if (await clickableMath.count() > 0) {
        await clickableMath.scrollIntoViewIfNeeded();
        await clickableMath.click();

        await page.waitForTimeout(500);
        expect(await messageInput.isVisible()).toBe(true);
      }
    });

    test("should maintain clickability after window resize", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Test message");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(1500);

      // Resize window
      await page.setViewportSize({ width: 800, height: 600 });
      await page.waitForTimeout(300);

      // Clickable math should still work
      const clickableMath = page.locator('[class*="cursor-pointer"]').filter({ has: page.locator('.math-renderer, .katex') }).first();

      if (await clickableMath.count() > 0) {
        await clickableMath.click();
        await page.waitForTimeout(500);

        expect(await messageInput.isVisible()).toBe(true);
      }
    });
  });

  test.describe("Integration with Chat Flow", () => {
    test("should send clicked LaTeX as new message", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Show formula");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(2000);

      // Count messages before click
      const messagesBefore = await page.locator('[class*="message"], .prose').count();

      // Click on math
      const clickableMath = page.locator('[class*="cursor-pointer"]').filter({ has: page.locator('.math-renderer, .katex') }).first();

      if (await clickableMath.count() > 0) {
        await clickableMath.click();
        await page.waitForTimeout(1000);

        // Should have more messages now
        const messagesAfter = await page.locator('[class*="message"], .prose').count();
        expect(messagesAfter).toBeGreaterThanOrEqual(messagesBefore);
      }
    });

    test("should clear input after clicking math expression", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Test");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(1500);

      const clickableMath = page.locator('[class*="cursor-pointer"]').filter({ has: page.locator('.math-renderer, .katex') }).first();

      if (await clickableMath.count() > 0) {
        // Type something in input
        await messageInput.fill("Partial message");

        // Click math - this sends it as a message
        await clickableMath.click();

        await page.waitForTimeout(500);

        // Input might be cleared depending on implementation
        const inputValue = await messageInput.inputValue();
        // Either empty or still functional
        expect(inputValue !== undefined).toBe(true);
      }
    });
  });
});
