/* eslint-disable security/detect-object-injection */
import '@testing-library/jest-dom';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_GATEWAY_URL = 'http://localhost:8000';
process.env.NEXT_PUBLIC_SENTRY_DSN = 'test-dsn';

// Mock window.matchMedia for next-themes and other libraries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock URL for Next.js API route testing
// Vitest with jsdom doesn't provide URL constructor, so we need to use Node.js URL
import { URL as NodeURL, URLSearchParams as NodeURLSearchParams } from 'url';

// Make URL available globally for Next.js API route tests
if (typeof global.URL === 'undefined') {
  global.URL = NodeURL as unknown as typeof URL;
}

// Make URLSearchParams available globally
if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = NodeURLSearchParams as unknown as typeof URLSearchParams;
}

// Mock URL.createObjectURL for file previews (browser API)
if (typeof global.URL !== 'undefined' && !global.URL.createObjectURL) {
  Object.assign(global.URL, {
    createObjectURL: vi.fn((file: File) => `blob:mock-url-${file.name}`),
    revokeObjectURL: vi.fn(),
  });
}

// Add DataTransfer to global scope for file input tests (jsdom doesn't have it)
if (typeof global.DataTransfer === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).DataTransfer = class {
    private _files: File[] = [];
    private _data: Map<string, string> = new Map();

    get files(): FileList {
      const fileList = {
        length: this._files.length,
        item: (index: number) => this._files[index] || null,
        [Symbol.iterator]: function* (this: FileList) {
          for (let i = 0; i < this.length; i++) {
            yield this.item(i);
          }
        },
      } as FileList;

      // Make it iterable
      Object.setPrototypeOf(fileList, FileList.prototype);
      return fileList;
    }

    get items(): DataTransferItemList {
      const itemList = {
        add: (file: File | string, type?: string): DataTransferItem | null => {
          if (file instanceof File) {
            this._files.push(file);
            // Return a mock DataTransferItem
            return {
              kind: 'file',
              type: type || file.type,
              getAsFile: () => file,
              getAsString: vi.fn(),
              webkitGetAsEntry: vi.fn(),
            } as DataTransferItem;
          }
          return null;
        },
        remove: vi.fn(),
        clear: vi.fn(),
        length: this._files.length,
        item: (_index: number) => null,
        [Symbol.iterator]: function* () {},
      } as unknown as DataTransferItemList;

      return itemList;
    }

    get types(): readonly string[] {
      return Array.from(this._data.keys());
    }

    clearData(format?: string): void {
      if (format) {
        this._data.delete(format);
      } else {
        this._data.clear();
      }
    }

    getData(format: string): string {
      return this._data.get(format) || '';
    }

    setData(format: string, data: string): void {
      this._data.set(format, data);
    }

    setDragImage(_image: Element | HTMLImageElement, _x: number, _y: number): void {
      // Mock implementation - no-op
    }

    dropEffect = 'none';
    effectAllowed = 'all';
  };
}

// Mock ResizeObserver for libraries like @zag-js/tabs
if (typeof global.ResizeObserver === 'undefined') {
  (global as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver = vi
    .fn()
    .mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
}

// Suppress CSS parsing errors from jsdom (Chakra UI uses CSS that jsdom can't parse)
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  // Filter out CSS parsing errors from jsdom
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Could not parse CSS stylesheet') ||
      args[0].includes('Error: Could not parse CSS stylesheet'))
  ) {
    return;
  }
  originalConsoleError(...args);
};
