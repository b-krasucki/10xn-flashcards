import { vi } from "vitest";

/**
 * Helper functions and utilities for Vitest unit tests
 */

/**
 * Create a mock function with TypeScript support
 */
export function createMockFn<T extends (...args: unknown[]) => unknown>(): T {
  return vi.fn() as unknown as T;
}

/**
 * Create a promise that resolves after a delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for next tick
 */
export function nextTick(): Promise<void> {
  return new Promise((resolve) => process.nextTick(resolve));
}

/**
 * Mock localStorage
 */
export function mockLocalStorage() {
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  };

  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });

  return localStorageMock;
}

/**
 * Mock fetch API
 */
export function mockFetch() {
  const fetchMock = vi.fn();
  global.fetch = fetchMock;
  return fetchMock;
}

/**
 * Mock console methods
 */
export function mockConsole() {
  return {
    log: vi.spyOn(console, "log").mockImplementation(() => {
      /* no-op */
    }),
    error: vi.spyOn(console, "error").mockImplementation(() => {
      /* no-op */
    }),
    warn: vi.spyOn(console, "warn").mockImplementation(() => {
      /* no-op */
    }),
    info: vi.spyOn(console, "info").mockImplementation(() => {
      /* no-op */
    }),
  };
}

/**
 * Mock Date.now()
 */
export function mockDateNow(timestamp: number) {
  return vi.spyOn(Date, "now").mockReturnValue(timestamp);
}

/**
 * Create a mock component for React testing
 */
export function mockComponent(name: string) {
  return vi.fn().mockImplementation(() => {
    return { type: "div", props: { "data-testid": `mock-${name}` } };
  });
}

/**
 * Assert that a function was called with specific arguments
 */
export function expectCalledWith<T extends (...args: unknown[]) => unknown>(mockFn: T, ...args: Parameters<T>) {
  return expect(mockFn).toHaveBeenCalledWith(...args);
}

/**
 * Assert that a function was called a specific number of times
 */
export function expectCalledTimes<T extends (...args: unknown[]) => unknown>(mockFn: T, times: number) {
  return expect(mockFn).toHaveBeenCalledTimes(times);
}
