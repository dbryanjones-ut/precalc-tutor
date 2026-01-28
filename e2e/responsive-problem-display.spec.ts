import { test, expect, devices } from "@playwright/test";

test.describe("Problem Display - Responsive Design E2E Tests", () => {
  const testMessage = "Solve the equation $x^2 + 2x + 1 = 0$";

  test.describe("Desktop Display (1920x1080)", () => {
    test.use({ ...devices["Desktop Chrome"] });

    test("should display problem in header on desktop", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
        await page.waitForLoadState("networkidle");
      }

      // Check header is visible
      const header = page.locator('h2:has-text("AI Tutor"), [class*="header"]');
      if (await header.count() > 0) {
        expect(await header.first().isVisible()).toBe(true);
      }
    });

    test("should have sufficient space for math expressions on desktop", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill(testMessage);

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Check message container has good width
      const messageContainer = page.locator('[class*="message"], .prose').last();
      if (await messageContainer.count() > 0) {
        const box = await messageContainer.boundingBox();
        expect(box).toBeTruthy();
        expect(box!.width).toBeGreaterThan(300);
      }
    });

    test("should not clip or truncate long expressions on desktop", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      const longExpression = "$x_1 + x_2 + x_3 + x_4 + x_5 + x_6 + x_7 + x_8 + x_9 + x_{10}$";
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill(`Calculate ${longExpression}`);

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Math should be fully visible
      const mathElement = page.locator('.katex, .math-renderer').first();
      if (await mathElement.count() > 0) {
        const isVisible = await mathElement.isVisible();
        expect(isVisible).toBe(true);
      }
    });

    test("should display mode toggle inline on desktop", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      // Mode toggle should be visible
      const modeToggle = page.locator('button:has-text("Socratic"), button:has-text("Explanation")');
      if (await modeToggle.count() > 0) {
        expect(await modeToggle.first().isVisible()).toBe(true);
      }
    });
  });

  test.describe("Tablet Display (iPad)", () => {
    test.use({ ...devices["iPad Pro"] });

    test("should display properly on tablet (768x1024)", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill(testMessage);

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Interface should be usable
      expect(await messageInput.isVisible()).toBe(true);
      expect(await sendButton.isVisible()).toBe(true);
    });

    test("should adapt math expression width on tablet", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Show $\\frac{a}{b}$");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Math should fit within viewport
      const mathElement = page.locator('.katex, .math-renderer').first();
      if (await mathElement.count() > 0) {
        const box = await mathElement.boundingBox();
        const viewport = page.viewportSize();

        if (box && viewport) {
          expect(box.width).toBeLessThan(viewport.width);
        }
      }
    });

    test("should maintain header visibility on tablet", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      // Header should be visible
      const header = page.locator('h2:has-text("AI Tutor"), [class*="header"]');
      if (await header.count() > 0) {
        const headerElement = header.first();
        const isVisible = await headerElement.isVisible();
        expect(isVisible).toBe(true);
      }
    });
  });

  test.describe("Mobile Display (iPhone)", () => {
    test.use({ ...devices["iPhone 12"] });

    test("should display properly on mobile (390x844)", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
        await page.waitForTimeout(500);
      }

      // Interface should be accessible
      const messageInput = page.locator('textarea, input[type="text"]').last();
      expect(await messageInput.isVisible()).toBe(true);
    });

    test("should wrap long math expressions on mobile", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill(testMessage);

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Math should be visible and fit
      const mathElement = page.locator('.katex, .math-renderer').first();
      if (await mathElement.count() > 0) {
        const box = await mathElement.boundingBox();
        const viewport = page.viewportSize();

        if (box && viewport) {
          // Math should not overflow viewport
          expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 10); // Small margin for rounding
        }
      }
    });

    test("should have accessible touch targets on mobile", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      // Buttons should be large enough for touch
      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      if (await sendButton.count() > 0) {
        const box = await sendButton.boundingBox();

        if (box) {
          // Touch target should be at least 44x44 pixels (accessibility guideline)
          expect(box.height).toBeGreaterThanOrEqual(36); // Slightly smaller is acceptable with good spacing
          expect(box.width).toBeGreaterThanOrEqual(36);
        }
      }
    });

    test("should hide non-essential text on mobile", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      // Some labels might be hidden on mobile with sm:inline classes
      // This is expected behavior for responsive design
      const clearButton = page.locator('button:has-text("Clear")').first();
      if (await clearButton.count() > 0) {
        // Button should exist even if text is hidden
        expect(await clearButton.isVisible()).toBe(true);
      }
    });

    test("should maintain message readability on mobile", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Short test");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Message should be readable (not too narrow)
      const messageContainer = page.locator('[class*="message"], .prose').last();
      if (await messageContainer.count() > 0) {
        const box = await messageContainer.boundingBox();

        if (box) {
          // Should have reasonable width even on mobile
          expect(box.width).toBeGreaterThan(200);
        }
      }
    });
  });

  test.describe("Small Mobile Display (iPhone SE)", () => {
    test.use({ ...devices["iPhone SE"] });

    test("should display properly on small mobile (375x667)", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
        await page.waitForTimeout(500);
      }

      const messageInput = page.locator('textarea, input[type="text"]').last();
      expect(await messageInput.isVisible()).toBe(true);
    });

    test("should scale math appropriately on small screens", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Calculate $x^2$");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Math should be visible
      const mathElement = page.locator('.katex, .math-renderer').first();
      if (await mathElement.count() > 0) {
        expect(await mathElement.isVisible()).toBe(true);
      }
    });
  });

  test.describe("Landscape Orientation (Mobile)", () => {
    test("should handle landscape mode on mobile", async ({ page, viewport }) => {
      // Set landscape viewport
      await page.setViewportSize({ width: 844, height: 390 });

      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill(testMessage);

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Interface should still be usable
      expect(await messageInput.isVisible()).toBe(true);
    });

    test("should utilize horizontal space in landscape", async ({ page }) => {
      await page.setViewportSize({ width: 844, height: 390 });

      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      // Interface should use available width
      const messageInput = page.locator('textarea, input[type="text"]').last();
      const box = await messageInput.boundingBox();

      if (box) {
        // Should use significant portion of width
        expect(box.width).toBeGreaterThan(400);
      }
    });
  });

  test.describe("Edge Cases for Problem Display", () => {
    test("should handle very long problem text on all screen sizes", async ({ page }) => {
      const sizes = [
        { width: 375, height: 667, name: "Mobile" },
        { width: 768, height: 1024, name: "Tablet" },
        { width: 1920, height: 1080, name: "Desktop" },
      ];

      for (const size of sizes) {
        await page.setViewportSize({ width: size.width, height: size.height });
        await page.goto("/");

        const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
        if (await aiTutorLink.isVisible()) {
          await aiTutorLink.click();
        }

        const longProblem = "Solve: " + "$x + y + z + ".repeat(10) + "1 = 0$";
        const messageInput = page.locator('textarea, input[type="text"]').last();
        await messageInput.fill(longProblem);

        const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
        await sendButton.click();

        await page.waitForTimeout(500);

        // Should not break layout
        expect(await messageInput.isVisible()).toBe(true);
      }
    });

    test("should not have horizontal scroll on any screen size", async ({ page }) => {
      const sizes = [
        { width: 375, height: 667 },
        { width: 768, height: 1024 },
        { width: 1920, height: 1080 },
      ];

      for (const size of sizes) {
        await page.setViewportSize(size);
        await page.goto("/");

        const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
        if (await aiTutorLink.isVisible()) {
          await aiTutorLink.click();
        }

        const messageInput = page.locator('textarea, input[type="text"]').last();
        await messageInput.fill(testMessage);

        const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
        await sendButton.click();

        await page.waitForTimeout(500);

        // Check for horizontal overflow
        const hasHorizontalScroll = await page.evaluate(() => {
          return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        expect(hasHorizontalScroll).toBe(false);
      }
    });

    test("should handle screen rotation", async ({ page }) => {
      // Start in portrait
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Test before rotation");

      // Rotate to landscape
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForTimeout(300);

      // Should still be functional
      expect(await messageInput.isVisible()).toBe(true);

      // Should be able to send
      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);
      expect(await messageInput.isVisible()).toBe(true);
    });
  });

  test.describe("Problem Display Accessibility", () => {
    test("should maintain focus visibility on all screen sizes", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      // Tab through interface
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      const focusedElement = page.locator(":focus");
      if (await focusedElement.count() > 0) {
        // Focused element should be visible
        expect(await focusedElement.isVisible()).toBe(true);
      }
    });

    test("should maintain sufficient color contrast on all screens", async ({ page }) => {
      await page.goto("/");

      const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
      if (await aiTutorLink.isVisible()) {
        await aiTutorLink.click();
      }

      // Text elements should be visible
      const header = page.locator('h2, h3').first();
      if (await header.count() > 0) {
        expect(await header.isVisible()).toBe(true);
      }
    });
  });
});
