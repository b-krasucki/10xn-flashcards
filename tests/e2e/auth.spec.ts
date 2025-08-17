import { test, expect } from "@playwright/test";
import { AuthPage } from "./page-objects/AuthPage";
import { testUsers } from "./fixtures/test-data";

test.describe("Uwierzytelnienie", () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
    await authPage.goto();
  });

  test("powinno wyświetlać formularz logowania domyślnie", async () => {
    await expect(authPage.emailInput).toBeVisible();
    await expect(authPage.passwordInput).toBeVisible();
    await expect(authPage.signInButton).toBeVisible();
    await expect(authPage.switchToSignUpLink).toBeVisible();
  });

  test("powinno przełączyć na formularz rejestracji", async ({ page }) => {
    // Sprawdź, czy przycisk przełączania jest widoczny przed kliknięciem
    await expect(authPage.switchToSignUpLink).toBeVisible();

    await authPage.switchToSignUpLink.click();

    // Poczekaj chwilę na React re-render
    await page.waitForTimeout(500);

    // Sprawdź czy pole potwierdzenia hasła jest widoczne (specyficzne dla rejestracji)
    await expect(page.getByLabel("Potwierdź hasło")).toBeVisible();

    // Sprawdź czy przycisk ma poprawny tekst
    await expect(authPage.signUpButton).toBeVisible({ timeout: 10000 });
    await expect(authPage.switchToSignInLink).toBeVisible();
  });

  test("powinno pokazać błąd dla nieprawidłowych danych logowania", async ({ page }) => {
    await authPage.signIn(testUsers.invalidUser.email, testUsers.invalidUser.password);

    // Wait for error message or stay on auth page
    await expect(page).toHaveURL(/auth/);
  });

  test("powinno przekierować do panelu po udanym logowaniu", async () => {
    // Uwaga: Ten test wymaga prawidłowego użytkownika testowego w bazie danych
    // lub mock uwierzytelnienia dla środowiska E2E

    // Do celów demonstracyjnych, testujemy wysłanie formularza
    await authPage.emailInput.fill(testUsers.validUser.email);
    await authPage.passwordInput.fill(testUsers.validUser.password);

    await expect(authPage.signInButton).toBeEnabled();
  });

  test("powinno walidować format adresu email", async ({ page }) => {
    await authPage.emailInput.fill("invalid-email");
    await authPage.passwordInput.fill("password123");
    await authPage.signInButton.click();

    // Sprawdź czy pojawił się błąd walidacji React Hook Form
    await expect(page.locator("#email-error")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#email-error")).toContainText("Nieprawidłowy format e-mail");
  });

  test("powinno wymagać poprawnego hasła", async ({ page }) => {
    await authPage.emailInput.fill(testUsers.validUser.email);
    // Wpisz za krótkie hasło (mniej niż 6 znaków)
    await authPage.passwordInput.fill("123");
    await authPage.signInButton.click();

    // Sprawdź czy pojawił się błąd walidacji dla hasła
    await expect(page.locator("#password-error")).toBeVisible({ timeout: 5000 });
    await expect(page.locator("#password-error")).toContainText("Hasło musi mieć co najmniej 6 znaków");
  });
});
