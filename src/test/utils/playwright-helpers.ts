import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Helper functions for Playwright E2E tests
 */

export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for loading state to finish
   */
  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * Take a screenshot with automatic naming
   */
  async takeScreenshot(name: string) {
    await expect(this.page).toHaveScreenshot(`${name}.png`);
  }

  /**
   * Check if element is visible and enabled
   */
  async isElementReady(selector: string) {
    const element = this.page.locator(selector);
    await expect(element).toBeVisible();
    await expect(element).toBeEnabled();
    return element;
  }

  /**
   * Fill form with data
   */
  async fillForm(formData: Record<string, string>) {
    for (const [field, value] of Object.entries(formData)) {
      await this.page.getByLabel(field).fill(value);
    }
  }

  /**
   * Wait for API response
   */
  async waitForResponse(urlPattern: string | RegExp) {
    return await this.page.waitForResponse(urlPattern);
  }

  /**
   * Mock API response
   */
  async mockApiResponse(url: string | RegExp, response: unknown) {
    await this.page.route(url, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(response),
      });
    });
  }

  /**
   * Clear all cookies and local storage
   */
  async clearStorage() {
    await this.page.context().clearCookies();
    await this.page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  /**
   * Check console errors
   */
  async checkConsoleErrors(): Promise<string[]> {
    const errors: string[] = [];
    this.page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });
    return errors;
  }
}
