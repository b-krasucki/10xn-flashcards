import { test, expect } from "@playwright/test";
import { testDecks } from "./fixtures/test-data";
import { loginTestUser, logoutUser, testUsers } from "./utils/auth-helpers";

test.describe("Zarządzanie taliami", () => {
  test.describe("Bez uwierzytelnienia", () => {
    test("powinno przekierować na stronę logowania", async ({ page }) => {
      await logoutUser(page);
      await page.goto("/flashcards");
      await expect(page).toHaveURL(/\/auth/);
    });
  });

  test.describe("Z uwierzytelnionym użytkownikiem", () => {
    test.beforeEach(async ({ page }) => {
      await loginTestUser(page, testUsers.validUser);

      // Mock API endpoints dla talii
      await page.route("/api/decks", async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              decks: [
                {
                  id: 1,
                  deck_name: "Przykładowa talia",
                  flashcard_count: 5,
                  created_at: "2024-01-01T00:00:00.000Z",
                  updated_at: "2024-01-01T00:00:00.000Z",
                },
              ],
            }),
          });
        } else if (route.request().method() === "POST") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              deck: {
                id: 2,
                deck_name: testDecks.sampleDeck.name,
                flashcard_count: 0,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            }),
          });
        } else {
          await route.continue();
        }
      });

      await page.goto("/flashcards");
    });

    test("powinno wyświetlać stronę zarządzania taliami", async ({ page }) => {
      await expect(page.getByRole("heading", { name: "Moje talie" })).toBeVisible();
      await expect(page.getByText("Przeglądaj, edytuj i zarządzaj swoimi taliami fiszek")).toBeVisible();
    });

    test("powinno wyświetlać przycisk dodawania nowej talii", async ({ page }) => {
      await expect(page.getByText("Dodaj nową talię")).toBeVisible();
    });

    test("powinno otworzyć dialog tworzenia talii", async ({ page }) => {
      await page.getByText("Dodaj nową talię").click();

      await expect(page.getByText("Utwórz nową talię")).toBeVisible();
      await expect(page.getByLabel("Nazwa talii")).toBeVisible();
    });

    test("powinno utworzyć nową talię", async ({ page }) => {
      // Kliknij przycisk dodawania nowej talii
      await page.getByText("Dodaj nową talię").click();

      // Wypełnij formularz
      const nameInput = page.getByLabel("Nazwa talii");
      await nameInput.fill(testDecks.sampleDeck.name);

      // Kliknij przycisk utwórz
      await page.getByRole("button", { name: "Utwórz" }).click();

      // Sprawdź czy talia została utworzona (strona powinna przekierować do szczegółów talii)
      await expect(page).toHaveURL(/\/deck\//);
    });

    test("powinno wyświetlać liczbę talii w nagłówku", async ({ page }) => {
      // Sprawdź czy nagłówek zawiera informację o liczbie talii
      await expect(page.locator("h2").filter({ hasText: /Twoje talie.*\(\d+\)/ })).toBeVisible();
    });
  });
});
