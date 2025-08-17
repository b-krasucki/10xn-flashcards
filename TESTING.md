# Testing Guide

This document provides comprehensive guidance on testing in the 10xn-flashcards application.

## Overview

Our testing strategy includes:

- **Unit Tests**: Component and service testing with Vitest
- **E2E Tests**: Full application flow testing with Playwright
- **API Mocking**: MSW for unit tests, Playwright routing for E2E

## Tech Stack

### Unit Testing

- **Vitest**: Fast test runner with native TypeScript support
- **React Testing Library**: Component testing with user-centric approach
- **MSW (Mock Service Worker)**: API mocking for tests
- **jsdom**: DOM simulation environment

### E2E Testing

- **Playwright**: Cross-browser automation testing
- **Chromium**: Primary browser for testing (configured for desktop)

## Quick Start

### Running Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# Run all tests
npm run test:all
```

### File Structure

```
tests/
├── unit/                    # Unit tests
│   ├── components/         # Component tests
│   └── services/          # Service tests
└── e2e/                    # E2E tests
    ├── fixtures/           # Test data
    ├── page-objects/       # Page Object Model
    └── *.spec.ts          # Test files

src/test/                   # Testing utilities
├── setup.ts               # Test environment setup
├── mocks/                 # MSW handlers
├── utils/                 # Testing helpers
└── vitest.d.ts           # Type definitions
```

## Writing Unit Tests

### Component Testing

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@/test/utils/test-utils'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledOnce()
  })
})
```

### Service Testing

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockFlashcard } from "@/test/utils/mock-data";

// Mock dependencies
vi.mock("@/db/supabase.client", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
    })),
  },
}));

describe("Flashcards Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch flashcards", async () => {
    const mockData = [createMockFlashcard()];
    // Test implementation
  });
});
```

## Writing E2E Tests

### Page Object Model

```typescript
// tests/e2e/page-objects/DashboardPage.ts
import { Page, Locator } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly createDeckButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.createDeckButton = page.getByRole("button", { name: "Create New Deck" });
  }

  async goto() {
    await this.page.goto("/");
  }

  async createDeck(name: string) {
    await this.createDeckButton.click();
    await this.page.getByLabel("Deck Name").fill(name);
    await this.page.getByRole("button", { name: "Create" }).click();
  }
}
```

### Test Implementation

```typescript
import { test, expect } from "@playwright/test";
import { DashboardPage } from "./page-objects/DashboardPage";

test.describe("Dashboard", () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
  });

  test("should create a new deck", async ({ page }) => {
    await dashboardPage.createDeck("Test Deck");
    await expect(page.getByText("Test Deck")).toBeVisible();
  });
});
```

## Testing Best Practices

### Unit Tests

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it does it
2. **Use Descriptive Test Names**: Make test names clear and specific
3. **Mock External Dependencies**: Use vi.mock() for external services
4. **Test Edge Cases**: Include error conditions and boundary cases
5. **Keep Tests Isolated**: Each test should be independent

### E2E Tests

1. **Use Page Object Model**: Encapsulate page interactions in classes
2. **Test Critical User Flows**: Focus on essential application paths
3. **Use Data Attributes**: Add `data-testid` attributes for reliable selectors
4. **Test Responsive Design**: Include mobile viewport testing
5. **Visual Regression Testing**: Use screenshots for UI consistency

### General Guidelines

1. **Arrange-Act-Assert Pattern**: Structure tests clearly
2. **Use Factory Functions**: Create reusable test data with factories
3. **Mock External Services**: Don't make real API calls in tests
4. **Clean Up After Tests**: Reset state between tests
5. **Use Meaningful Assertions**: Be specific about what you're testing

## Configuration

### Vitest Config (`vitest.config.ts`)

- Environment: jsdom for DOM testing
- Setup files for global test configuration
- Coverage reporting with thresholds
- Custom aliases for imports

### Playwright Config (`playwright.config.ts`)

- Chromium browser only (per requirements)
- Automatic dev server startup
- Trace collection on retry
- Screenshots and videos on failure

## Troubleshooting

### Common Issues

1. **Module Resolution**: Ensure path aliases are configured in both `vitest.config.ts` and `tsconfig.json`
2. **Mock Not Working**: Check mock factory placement and imports
3. **Type Errors**: Add necessary type declarations to `vitest.d.ts`
4. **E2E Timeouts**: Increase timeout values or add proper wait conditions

### Debug Commands

```bash
# Debug specific test
npm run test -- --run --reporter=verbose ComponentName

# Debug E2E test
npm run test:e2e:debug

# Check test coverage
npm run test:coverage
```

## Continuous Integration

The testing setup is designed to work with CI/CD pipelines:

- Tests run in headless mode by default
- Coverage reports are generated
- Playwright tests include retry logic
- All dependencies are properly locked

## Performance Testing

While not included in the initial setup, consider adding:

- Lighthouse audits for performance metrics
- k6 for load testing APIs
- Bundle size analysis

## Security Testing

Consider adding:

- OWASP ZAP for security scanning
- npm audit for dependency vulnerabilities
- CSRF and XSS testing in E2E scenarios
