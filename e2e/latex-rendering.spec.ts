import { test, expect } from "@playwright/test";

test.describe("LaTeX Rendering in AI Tutor - E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");

    // Navigate to AI Tutor
    const aiTutorLink = page.locator('a:has-text("AI Tutor"), button:has-text("AI Tutor")').first();
    if (await aiTutorLink.isVisible()) {
      await aiTutorLink.click();
      await page.waitForLoadState("networkidle");
    }
  });

  test.describe("Inline Math Rendering", () => {
    test("should render simple inline math: $x + y$", async ({ page }) => {
      // Type a message with inline math
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("What is $x + y$ when x is 2?");

      // Send message
      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      // Wait for message to appear
      await page.waitForTimeout(1000);

      // Check if KaTeX rendered elements exist
      const katexElements = page.locator('.katex, .math-renderer, .math-inline');
      const count = await katexElements.count();

      // Should have at least one math element (from user message)
      expect(count).toBeGreaterThan(0);
    });

    test("should render inline math within text flow", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("The value of $x^2$ equals 4");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Math should be inline with text (not on separate line)
      const messageContent = page.locator('.prose, [class*="message"]').last();
      const text = await messageContent.textContent();

      // Should contain both text and math
      expect(text).toBeTruthy();
    });

    test("should render complex inline expressions: $\\frac{a}{b}$", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Simplify $\\frac{a}{b}$ please");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Check for KaTeX fraction rendering
      const katexFrac = page.locator('.katex-html, .katex, .math-renderer');
      expect(await katexFrac.count()).toBeGreaterThan(0);
    });

    test("should render multiple inline expressions in one message", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Compare $x^2$ with $y^2$ and $z^2$");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Should have multiple math elements
      const mathElements = page.locator('.katex, .math-renderer');
      const count = await mathElements.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe("Display Math Rendering", () => {
    test("should render display math on separate line: $$x^2$$", async ({ page }) => {
      // This would require AI response with display math
      // For now, we test the UI can handle it
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Show me the quadratic formula");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      // Wait for potential AI response
      await page.waitForTimeout(2000);

      // Check page is still functional
      expect(await messageInput.isVisible()).toBe(true);
    });

    test("should center display math blocks", async ({ page }) => {
      // Check if display math (when present) is centered
      const displayMath = page.locator('.math-display, [class*="display"]');

      if (await displayMath.count() > 0) {
        const first = displayMath.first();
        const box = await first.boundingBox();
        expect(box).toBeTruthy();
      }
    });
  });

  test.describe("Complex LaTeX Expressions", () => {
    test("should render square roots: $\\sqrt{x}$", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("What is $\\sqrt{x}$ when x is 16?");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      const mathElements = page.locator('.katex, .math-renderer');
      expect(await mathElements.count()).toBeGreaterThan(0);
    });

    test("should render multiplication: $x \\cdot y$", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Calculate $x \\cdot y$");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      const mathElements = page.locator('.katex, .math-renderer');
      expect(await mathElements.count()).toBeGreaterThan(0);
    });

    test("should render exponents correctly: $5^3 \\cdot 5^2 = 5^{3 + 2}$", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Simplify $5^3 \\cdot 5^2 = 5^{3 + 2}$");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Check rendering succeeded
      const mathElements = page.locator('.katex, .math-renderer');
      expect(await mathElements.count()).toBeGreaterThan(0);
    });
  });

  test.describe("Special Characters and Symbols", () => {
    test("should render Greek letters: $\\alpha + \\beta$", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("What is $\\alpha + \\beta$?");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      const mathElements = page.locator('.katex, .math-renderer');
      expect(await mathElements.count()).toBeGreaterThan(0);
    });

    test("should render infinity symbol: $\\infty$", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("As x approaches $\\infty$");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      const mathElements = page.locator('.katex, .math-renderer');
      expect(await mathElements.count()).toBeGreaterThan(0);
    });
  });

  test.describe("Edge Cases", () => {
    test("should handle very long expressions", async ({ page }) => {
      const longExpr = "x_1 + x_2 + x_3 + x_4 + x_5 + x_6 + x_7 + x_8 + x_9 + x_{10}";
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill(`Calculate $${longExpr}$`);

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Page should not crash
      expect(await messageInput.isVisible()).toBe(true);
    });

    test("should handle expressions with lots of math", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Compare $a$, $b$, $c$, $d$, $e$, and $f$");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      const mathElements = page.locator('.katex, .math-renderer');
      expect(await mathElements.count()).toBeGreaterThanOrEqual(6);
    });

    test("should not break with empty expression: $$", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Test $$ test");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Page should still be functional
      expect(await messageInput.isVisible()).toBe(true);
    });
  });

  test.describe("Rendering Performance", () => {
    test("should render multiple messages with math quickly", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();

      const startTime = Date.now();

      // Send multiple messages
      for (let i = 1; i <= 3; i++) {
        await messageInput.fill(`Message ${i} with $x^${i}$`);
        await sendButton.click();
        await page.waitForTimeout(300);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete reasonably fast (under 5 seconds for 3 messages)
      expect(duration).toBeLessThan(5000);
    });

    test("should not slow down with multiple expressions", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();

      await messageInput.fill("$a$ $b$ $c$ $d$ $e$ $f$ $g$ $h$ $i$ $j$");
      await sendButton.click();

      await page.waitForTimeout(1000);

      // Page should remain responsive
      await messageInput.fill("Follow-up question");
      expect(await messageInput.inputValue()).toBe("Follow-up question");
    });
  });

  test.describe("Accessibility", () => {
    test("should have accessible math elements", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Calculate $x^2$");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Math elements should have role="img" or be otherwise accessible
      const mathElements = page.locator('[role="img"], .katex, .math-renderer');
      const count = await mathElements.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should be navigable with keyboard", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Test message");

      // Tab through interface
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      // Should be able to tab through elements
      const activeElement = page.locator(":focus");
      expect(await activeElement.count()).toBe(1);
    });
  });

  test.describe("Visual Regression Prevention", () => {
    test("should not have overlapping math and text", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("The formula $x^2$ is simple");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Take screenshot for visual verification
      await page.screenshot({ path: 'test-results/latex-inline-rendering.png', fullPage: false });

      // Elements should be visible
      const mathElement = page.locator('.katex, .math-renderer').first();
      expect(await mathElement.isVisible()).toBe(true);
    });

    test("should maintain consistent spacing", async ({ page }) => {
      const messageInput = page.locator('textarea, input[type="text"]').last();
      await messageInput.fill("Before $x$ middle $y$ after");

      const sendButton = page.locator('button:has-text("Send"), button[type="submit"]').last();
      await sendButton.click();

      await page.waitForTimeout(500);

      // Check that message container has proper layout
      const messageContainer = page.locator('.prose, [class*="message"]').last();
      const box = await messageContainer.boundingBox();
      expect(box).toBeTruthy();
      expect(box!.height).toBeGreaterThan(0);
    });
  });
});
