import type { Page, Locator } from "@playwright/test";

export class AuthPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly signUpButton: Locator;
  readonly switchToSignUpLink: Locator;
  readonly switchToSignInLink: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel("Adres e-mail");
    this.passwordInput = page.getByLabel("Hasło");
    this.signInButton = page.locator('button[type="submit"]').filter({ hasText: "Zaloguj się" });
    this.signUpButton = page.locator('button[type="submit"]').filter({ hasText: "Utwórz konto" });
    this.switchToSignUpLink = page.getByText("Nie masz konta? Zarejestruj się");
    this.switchToSignInLink = page.getByText("Masz już konto? Zaloguj się");
    this.errorMessage = page.locator('[role="alert"]').first();
  }

  async goto() {
    await this.page.goto("/auth");
  }

  async signIn(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async signUp(email: string, password: string) {
    await this.switchToSignUpLink.click();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signUpButton.click();
  }

  async expectErrorMessage() {
    await this.errorMessage.waitFor();
    return this.errorMessage.textContent();
  }
}
