import type { Page } from "@playwright/test";

/**
 * Helper functions for authentication in E2E tests
 */

export interface TestUser {
  email: string;
  password: string;
  id?: string;
}

export const testUsers = {
  validUser: {
    email: "test@example.com",
    password: "testPassword123!",
    id: "test-user-id",
  },
  adminUser: {
    email: "admin@example.com",
    password: "adminPassword123!",
    id: "admin-user-id",
  },
};

/**
 * Mock authentication by setting up valid cookies and mocking Supabase responses
 */
export async function mockAuthentication(page: Page, user: TestUser = testUsers.validUser) {
  // Najpierw mockuj bezpośrednio middleware poprzez intercept całej strony
  await page.addInitScript(() => {
    // Override window navigation for middleware redirects
    const originalLocation = window.location;

    Object.defineProperty(window, "location", {
      value: new Proxy(originalLocation, {
        set(target, property, value) {
          // Intercept redirects to /auth and ignore them
          if (property === "href" && value.includes("/auth")) {
            console.log("Ignoring auth redirect during test");
            return true;
          }
          return Reflect.set(target, property, value);
        },
      }),
    });
  });

  // Mock wszystkie Supabase endpoints
  await page.route("**/auth/v1/**", async (route) => {
    const url = route.request().url();

    if (url.includes("/user")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: user.id,
          email: user.email,
          aud: "authenticated",
          role: "authenticated",
          email_confirmed_at: "2024-01-01T00:00:00.000Z",
          created_at: "2024-01-01T00:00:00.000Z",
          updated_at: "2024-01-01T00:00:00.000Z",
        }),
      });
    } else if (url.includes("/token")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_in: 3600,
          token_type: "bearer",
          user: {
            id: user.id,
            email: user.email,
          },
        }),
      });
    } else {
      await route.continue();
    }
  });

  // Mock internal API endpoints
  await page.route("/api/user", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: user.id,
        email: user.email,
      }),
    });
  });

  await page.route("/api/dashboard", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        totalFlashcards: 42,
        generatedFlashcards: 30,
        editedFlashcards: 8,
        manualFlashcards: 4,
        recentGenerations: [
          {
            id: 1,
            created_at: "2024-01-01T12:00:00Z",
            generated_count: 10,
            model: "gpt-4",
            deck_name: "Matematyka",
            deck_id: 1,
          },
        ],
      }),
    });
  });

  // Set authentication cookies z prawidłowymi tokenami JWT
  const mockAccessToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJhdXRoZW50aWNhdGVkIiwiZXhwIjoyMDAwMDAwMDAwLCJpYXQiOjE2MDAwMDAwMDAsImlzcyI6Imh0dHBzOi8vbG9jYWxob3N0IiwicmVmcmVzaF90b2tlbiI6InJlZnJlc2gtdG9rZW4iLCJyb2xlIjoiYXV0aGVudGljYXRlZCIsInN1YiI6InRlc3QtdXNlci1pZCIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.K8ZujNKzkdnhHGrV3gSSfcPNZKEhF4oXEQo8O8jf7g8";
  const mockRefreshToken = "refresh-token-mock";

  await page.context().addCookies([
    {
      name: "sb-access-token",
      value: encodeURIComponent(mockAccessToken),
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
    },
    {
      name: "sb-refresh-token",
      value: encodeURIComponent(mockRefreshToken),
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
    },
  ]);
}

/**
 * Login a test user via the auth form
 */
export async function loginTestUser(page: Page, user: TestUser = testUsers.validUser) {
  // Navigate to auth page
  await page.goto("/auth");

  // Fill in credentials
  await page.getByLabel("Adres e-mail").fill(user.email);
  await page.getByLabel("Hasło").fill(user.password);

  // Submit form
  await page.locator('button[type="submit"]').filter({ hasText: "Zaloguj się" }).click();

  // Wait for redirect to dashboard
  await page.waitForURL("/", { timeout: 10000 });
}

/**
 * Logout the current user
 */
export async function logoutUser(page: Page) {
  // Clear authentication cookies
  await page.context().clearCookies();

  // Clear local storage (with error handling)
  try {
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (error) {
    // Ignore localStorage errors in some contexts
    console.log("Could not clear localStorage:", error);
  }
}

/**
 * Check if user is authenticated by checking for redirect
 */
export async function isUserAuthenticated(page: Page): Promise<boolean> {
  await page.goto("/");
  await page.waitForTimeout(1000); // Wait for potential redirect

  const currentUrl = page.url();
  return !currentUrl.includes("/auth");
}
