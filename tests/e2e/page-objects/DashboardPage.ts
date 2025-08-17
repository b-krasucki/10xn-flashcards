import type { Page, Locator } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly dashboardTitle: Locator;
  readonly statisticsCards: Locator;
  readonly generateButton: Locator;
  readonly learnButton: Locator;
  readonly loadingIndicator: Locator;
  readonly recentGenerationsSection: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboardTitle = page.getByRole("heading", { name: "Dashboard" });
    this.statisticsCards = page.locator(".grid").filter({ hasText: "Wszystkie fiszki" });
    this.generateButton = page.getByRole("button", { name: /generuj.*fiszki/i });
    this.learnButton = page.getByRole("button", { name: /rozpocznij.*naukę/i });
    this.loadingIndicator = page.getByText("Ładowanie danych...");
    this.recentGenerationsSection = page.getByText("Ostatnie generacje");
  }

  async goto() {
    await this.page.goto("/");
  }

  async waitForDataToLoad() {
    // Poczekaj aż zniknie loader lub pojawią się dane
    await this.page.waitForFunction(
      () => {
        const loadingText = document.querySelector('text("Ładowanie danych...")');
        const statsText = document.querySelector('text("Wszystkie fiszki")');
        return !loadingText || !!statsText;
      },
      { timeout: 10000 }
    );
  }

  async navigateToGenerate() {
    await this.generateButton.click();
  }

  async navigateToLearn() {
    await this.learnButton.click();
  }

  async getStatisticValue(statisticName: string): Promise<string> {
    const card = this.page.locator(".grid > div").filter({ hasText: statisticName });
    const value = await card.locator("text-2xl, text-3xl").first().textContent();
    return value || "0";
  }
}