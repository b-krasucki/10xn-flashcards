import { test, expect } from "@playwright/test";
import { DashboardPage } from "./page-objects/DashboardPage";
import { mockAuthentication, logoutUser, testUsers } from "./utils/auth-helpers";

test.describe("Panel główny (Dashboard)", () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
  });

  test("powinno przekierować na stronę logowania gdy użytkownik nie jest zalogowany", async ({ page }) => {
    // Upewnij się, że nie ma uwierzytelnienia
    await logoutUser(page);

    // Próbuj przejść do dashboard bez logowania
    await dashboardPage.goto();

    // Powinno przekierować na stronę uwierzytelnienia
    await expect(page).toHaveURL(/\/auth/);
  });

  test("powinno wyświetlać stronę logowania po przekierowaniu", async ({ page }) => {
    await logoutUser(page);
    await dashboardPage.goto();

    // Sprawdź czy jesteśmy na stronie auth i widoczne są elementy logowania
    await expect(page).toHaveURL(/\/auth/);
    await expect(page.getByLabel("Adres e-mail")).toBeVisible();
    await expect(page.getByLabel("Hasło")).toBeVisible();
    await expect(page.locator('button[type="submit"]').filter({ hasText: "Zaloguj się" })).toBeVisible();
  });

  test("powinno umożliwić nawigację z dashboard URL do formularza logowania", async ({ page }) => {
    await logoutUser(page);

    // Symuluj scenariusz gdy użytkownik wpisuje bezpośrednio URL dashboard
    await page.goto("/");

    // Sprawdź przekierowanie
    await expect(page).toHaveURL(/\/auth/);

    // Sprawdź czy tytuł aplikacji jest widoczny
    await expect(page.getByText("10xn Flashcards")).toBeVisible();
    await expect(page.getByText("Ucz się efektywnie z fiszkami")).toBeVisible();
  });

  test.describe("Z uwierzytelnionym użytkownikiem", () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication dla każdego testu
      await mockAuthentication(page, testUsers.validUser);
    });

    test("powinno wyświetlać tytuł i opis dashboardu", async ({ page }) => {
      await dashboardPage.goto();

      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
      await expect(page.getByText("Przegląd Twoich fiszek i ostatnich aktywności")).toBeVisible();
    });

    test("powinno wyświetlać statystyki fiszek", async ({ page }) => {
      await dashboardPage.goto();

      // Poczekaj na załadowanie danych
      await expect(page.getByText("Wszystkie fiszki")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Wygenerowane")).toBeVisible();
      await expect(page.getByText("Edytowane")).toBeVisible();
      await expect(page.getByText("Manualne")).toBeVisible();
    });

    test("powinno wyświetlać opisy statystyk", async ({ page }) => {
      await dashboardPage.goto();

      // Sprawdź czy wszystkie karty statystyk są widoczne z opisami
      await expect(page.getByText("Wszystkie fiszki")).toBeVisible({ timeout: 10000 });
      await expect(page.getByText("Łączna liczba fiszek")).toBeVisible();

      await expect(page.getByText("Wygenerowane")).toBeVisible();
      await expect(page.getByText("Fiszki utworzone przez AI")).toBeVisible();

      await expect(page.getByText("Edytowane")).toBeVisible();
      await expect(page.getByText("AI fiszki z modyfikacjami")).toBeVisible();

      await expect(page.getByText("Manualne")).toBeVisible();
      await expect(page.getByText("Dodane ręcznie przez Ciebie")).toBeVisible();
    });

    test("powinno wyświetlać przyciski akcji", async ({ page }) => {
      await dashboardPage.goto();

      // Sprawdź czy są przyciski nawigacji - używamy aria-label
      await expect(page.getByRole("button", { name: "Rozpocznij generowanie nowych fiszek" })).toBeVisible({
        timeout: 10000,
      });
      await expect(page.getByRole("button", { name: "Rozpocznij sesję powtórek" })).toBeVisible();
    });

    test("powinno nawigować do generatora po kliknięciu przycisku", async ({ page }) => {
      await dashboardPage.goto();

      // Znajdź przycisk generowania fiszek i kliknij
      const generateButton = page.getByRole("button", { name: "Rozpocznij generowanie nowych fiszek" });
      await expect(generateButton).toBeVisible({ timeout: 10000 });

      await generateButton.click();

      // Powinno nawigować do strony generowania
      await expect(page).toHaveURL(/\/generate/);
    });

    test("powinno wyświetlać strone generowania fiszek", async ({ page }) => {
      await page.goto("/generate");

      await expect(page.getByText("Generowanie fiszek")).toBeVisible({ timeout: 10000 });
    });
  });
});
