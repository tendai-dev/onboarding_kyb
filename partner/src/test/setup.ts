import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
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
  useParams: () => ({}),
}));

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
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
import { URL as NodeURL, URLSearchParams as NodeURLSearchParams } from 'url';

// Make URL available globally for Next.js API route tests
if (typeof global.URL === 'undefined') {
  global.URL = NodeURL as any;
}

// Make URLSearchParams available globally
if (typeof global.URLSearchParams === 'undefined') {
  global.URLSearchParams = NodeURLSearchParams as any;
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
  (global as any).DataTransfer = class {
    private _files: File[] = [];
    
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
        item: (index: number) => null,
        [Symbol.iterator]: function* () {},
      } as unknown as DataTransferItemList;
      
      return itemList;
    }
    
    dropEffect = 'none';
    effectAllowed = 'all';
  };
}

// Mock ResizeObserver for libraries like @zag-js/tabs
if (typeof global.ResizeObserver === 'undefined') {
  (global as any).ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));
}

// Mock IndexedDB globally to prevent unhandled errors
if (typeof global.indexedDB === 'undefined') {
  const mockDB = {
    transaction: vi.fn(() => ({
      objectStore: vi.fn(() => ({
        get: vi.fn(() => ({ onsuccess: null, onerror: null, result: null, error: null })),
        put: vi.fn(() => ({ onsuccess: null, onerror: null, result: null, error: null })),
        delete: vi.fn(() => ({ onsuccess: null, onerror: null, result: null, error: null })),
      })),
    })),
  };
  
  const mockRequest = {
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
    result: mockDB,
    error: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  
  (global as any).indexedDB = {
    open: vi.fn(() => mockRequest),
    deleteDatabase: vi.fn(() => mockRequest),
  };
}

// Mock framer-motion for components that use it
vi.mock('framer-motion', () => ({
  motion: {
    create: (Component: any) => Component,
    div: 'div',
    span: 'span',
    button: 'button',
  },
  AnimatePresence: ({ children }: any) => children,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn(),
  }),
}));

// Suppress CSS parsing errors from jsdom (Chakra UI uses CSS that jsdom can't parse)
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
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

